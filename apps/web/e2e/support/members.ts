import { randomUUID } from "node:crypto";
import type { BrowserContext } from "@playwright/test";
import { StreamClient } from "@stream-io/node-sdk";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { SESSION_COOKIE } from "@repo/auth/cookie";

// Miembros temporales para las pruebas: existen en la app de Stream de
// pruebas, y su sesión es una cookie de Firebase como la que crea la app
// principal al iniciar sesión (en el proyecto de Firebase de pruebas).

export const stream = new StreamClient(
  process.env.NEXT_PUBLIC_STREAM_API_KEY as string,
  process.env.STREAM_API_SECRET as string,
);

const firebase = getAuth(
  initializeApp(
    {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    },
    "e2e",
  ),
);

/** Prefijo del uid de Firebase de los miembros de prueba. */
const TEST_UID_PREFIX = "e2e_";
/** Prefijo de su id en Stream (`f_<uid>`, como `streamUserId`). */
const TEST_ID_PREFIX = `f_${TEST_UID_PREFIX}`;

export interface Member {
  /** Id en Stream. */
  id: string;
  /** Uid en Firebase. */
  uid: string;
  name: string;
  email: string;
}

export const createMember = async (
  name: string,
  { email }: { email?: string } = {},
): Promise<Member> => {
  const uid = `${TEST_UID_PREFIX}${randomUUID().slice(0, 8)}`;
  const id = `f_${uid}`;
  const member = { id, uid, name, email: email ?? `${uid}@example.test` };
  await stream.upsertUsers([{ id, name }]);
  await Promise.all([
    stream.feeds.getOrCreateFeed({
      feed_group_id: "timeline",
      feed_id: id,
      user_id: id,
    }),
    stream.feeds.getOrCreateFeed({
      feed_group_id: "notification",
      feed_id: id,
      user_id: id,
    }),
    stream.feeds.getOrCreateFeed({
      feed_group_id: "profile",
      feed_id: id,
      user_id: "system",
    }),
  ]);
  await stream.feeds.getOrCreateFollows({
    follows: ["general", "anuncios"].map((space) => ({
      source: `timeline:${id}`,
      target: `space:${space}`,
    })),
  });
  return member;
};

/**
 * Inicia sesión como `member` en el contexto del navegador. Firebase crea el
 * usuario al canjear el token propio; correo, nombre y verificación van como
 * datos del token, así que dos miembros pueden compartir correo (el admin).
 */
export const loginAs = async (
  context: BrowserContext,
  member: Member,
  { emailVerified = true }: { emailVerified?: boolean } = {},
) => {
  const customToken = await firebase.createCustomToken(member.uid, {
    email: member.email,
    email_verified: emailVerified,
    name: member.name,
  });
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  if (!response.ok) {
    // Por ejemplo CONFIGURATION_NOT_FOUND: Authentication sin activar en el
    // proyecto de pruebas (consola de Firebase → Authentication → Comenzar).
    const { error } = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(
      `Firebase rechazó el token de prueba: ${response.status} ${error?.message ?? ""}`,
    );
  }
  const { idToken } = (await response.json()) as { idToken: string };
  const value = await firebase.createSessionCookie(idToken, {
    expiresIn: 60 * 60 * 1000,
  });
  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value,
      domain: "localhost",
      path: "/",
      httpOnly: true,
    },
  ]);
};

/** Publica como `member` directamente en Stream (sin pasar por la UI). */
export const postAs = async (
  member: Member,
  text: string,
  space = "general",
) => {
  const { activity } = await stream.feeds.addActivity({
    type: "post",
    feeds: [`space:${space}`, `profile:${member.id}`],
    user_id: member.id,
    text,
  });
  return activity;
};

/** Llamada a la API de Stream con el token del miembro (como el navegador). */
export const memberApi = async (
  member: Member,
  method: string,
  path: string,
  body?: unknown,
) => {
  const token = stream.generateUserToken({
    user_id: member.id,
    validity_in_seconds: 600,
  });
  const response = await fetch(
    `https://feeds.stream-io-api.com/api/v2/feeds/${path}?api_key=${process.env.NEXT_PUBLIC_STREAM_API_KEY}`,
    {
      method,
      headers: {
        Authorization: token,
        "stream-auth-type": "jwt",
        "content-type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );
  return response.status;
};

/**
 * Borra lo que crearon los miembros (posts, comentarios y feeds). Los
 * usuarios se borran al final de la corrida en `global-teardown.ts`: Stream
 * limita mucho `deleteUsers` y no aguanta una llamada por prueba.
 */
export const deleteMemberContent = async (members: Member[]) => {
  const ids = members.map((member) => member.id);
  if (ids.length === 0) return;
  const [{ activities }, { comments }] = await Promise.all([
    stream.feeds.queryActivities({
      filter: { user_id: { $in: ids } },
      include_soft_deleted_activities: true,
      limit: 100,
    }),
    stream.feeds.queryComments({
      filter: { user_id: { $in: ids } },
      limit: 100,
    }),
  ]);
  await Promise.all([
    ...comments.map((comment) =>
      stream.feeds
        .deleteComment({ id: comment.id, hard_delete: true })
        .catch(() => {}),
    ),
    ...activities.map((activity) =>
      stream.feeds
        .deleteActivity({ id: activity.id, hard_delete: true })
        .catch(() => {}),
    ),
  ]);
  await Promise.all(
    ids.flatMap((id) =>
      ["timeline", "notification", "profile"].map((group) =>
        stream.feeds
          .deleteFeed({ feed_group_id: group, feed_id: id, hard_delete: true })
          .catch(() => {}),
      ),
    ),
  );
};

/**
 * Borra a todos los miembros de prueba (`f_e2e_*` en Stream, en lotes de 100)
 * y sus usuarios en Firebase (`e2e_*`).
 */
export const deleteAllTestMembers = async () => {
  for (;;) {
    const { users } = await stream.queryUsers({
      payload: {
        filter_conditions: { id: { $autocomplete: TEST_ID_PREFIX } },
        limit: 100,
      },
    });
    const ids = users
      .map((user) => user.id)
      .filter((id) => id.startsWith(TEST_ID_PREFIX));
    if (ids.length === 0) break;
    await deleteMemberContent(
      ids.map((id) => ({ id, uid: id.slice(2), name: id, email: "" })),
    );
    await stream.deleteUsers({ user_ids: ids, user: "hard" });
    if (ids.length < 100) break;
  }
  await deleteTestFirebaseUsers();
};

const deleteTestFirebaseUsers = async () => {
  const uids: string[] = [];
  let pageToken: string | undefined;
  do {
    const page = await firebase.listUsers(1000, pageToken);
    uids.push(
      ...page.users
        .map((user) => user.uid)
        .filter((uid) => uid.startsWith(TEST_UID_PREFIX)),
    );
    pageToken = page.pageToken;
  } while (pageToken);
  // `deleteUsers` acepta hasta 1000 por llamada.
  for (let i = 0; i < uids.length; i += 1000) {
    await firebase.deleteUsers(uids.slice(i, i + 1000));
  }
};
