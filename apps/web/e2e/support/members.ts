import { randomUUID } from "node:crypto";
import type { BrowserContext } from "@playwright/test";
import { StreamClient } from "@stream-io/node-sdk";
import { betterAuth } from "better-auth";
import { E2E_BASE_URL } from "../../playwright.config";

// Miembros temporales para las pruebas: existen en la app de Stream de
// pruebas, con su sesión firmada como la firmaría el login con Google.

export const stream = new StreamClient(
  process.env.NEXT_PUBLIC_STREAM_API_KEY as string,
  process.env.STREAM_API_SECRET as string,
);

// Misma configuración de sesión que `lib/auth.ts` (cookies cifradas, sin
// base de datos): las cookies que crea son válidas para el servidor.
const auth = betterAuth({
  baseURL: E2E_BASE_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true },
  user: { additionalFields: { streamId: { type: "string", required: true } } },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
      strategy: "jwe",
      refreshCache: true,
    },
  },
  logger: { disabled: true },
});

export interface Member {
  id: string;
  name: string;
  email: string;
}

export const createMember = async (
  name: string,
  { email }: { email?: string } = {},
): Promise<Member> => {
  const id = `e2e_${randomUUID().slice(0, 8)}`;
  const member = { id, name, email: email ?? `${id}@example.test` };
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

/** Inicia sesión como `member` en el contexto del navegador. */
export const loginAs = async (context: BrowserContext, member: Member) => {
  const response = await auth.handler(
    new Request(`${E2E_BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: E2E_BASE_URL },
      body: JSON.stringify({
        email: member.email,
        password: randomUUID(),
        name: member.name,
        streamId: member.id,
      }),
    }),
  );
  await context.addCookies(
    response.headers.getSetCookie().map((cookie) => {
      const [pair = ""] = cookie.split(";");
      const index = pair.indexOf("=");
      return {
        name: pair.slice(0, index),
        value: pair.slice(index + 1),
        domain: "localhost",
        path: "/",
        httpOnly: true,
      };
    }),
  );
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

/** Borra a todos los miembros de prueba (`e2e_*`), en lotes de 100. */
export const deleteAllTestMembers = async () => {
  for (;;) {
    const { users } = await stream.queryUsers({
      payload: {
        filter_conditions: { id: { $autocomplete: "e2e_" } },
        limit: 100,
      },
    });
    const ids = users
      .map((user) => user.id)
      .filter((id) => id.startsWith("e2e_"));
    if (ids.length === 0) return;
    await deleteMemberContent(ids.map((id) => ({ id, name: id, email: "" })));
    await stream.deleteUsers({ user_ids: ids, user: "hard" });
    if (ids.length < 100) return;
  }
};
