"use server";

import { headers } from "next/headers";
import { isAdmin } from "../../lib/admins";
import { auth } from "../../lib/auth";
import { profileFid, spaceFid } from "../../lib/feeds";
import { isBanned } from "../../lib/membership";
import { isStreamIdList, validMentions } from "../../lib/mentions";
import { takeRateLimit } from "../../lib/rate-limit";
import { canPostIn, findSpace } from "../../lib/spaces";
import { stream } from "../../lib/stream";

const MAX_TEXT_LENGTH = 5000;
const MAX_COMMENT_LENGTH = 2000;
const MAX_IMAGES = 4;

export type ActionResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });

// Sesión de un miembro que puede participar (no bloqueado).
const memberSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return fail("Tu sesión expiró. Vuelve a entrar.");
  if (await isBanned(session.user.streamId)) {
    return fail("Tu cuenta está suspendida.");
  }
  return session;
};

// Solo se aceptan imágenes subidas al CDN de Stream desde el composer.
const isStreamCdnUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" && url.hostname.endsWith(".stream-io-cdn.com")
    );
  } catch {
    return false;
  }
};

// Las publicaciones pasan por el servidor (y no directo desde el navegador)
// para validar permisos por espacio y limitar la frecuencia.
export async function createPost(input: {
  spaceId: string;
  text: string;
  images: string[];
  /** Miembros mencionados con `@Nombre` (reciben una notificación). */
  mentionedUserIds?: string[];
}): Promise<ActionResult> {
  // Una server action es un endpoint público: no confiar en los tipos.
  if (
    typeof input?.spaceId !== "string" ||
    typeof input.text !== "string" ||
    !Array.isArray(input.images) ||
    !input.images.every((image) => typeof image === "string") ||
    (input.mentionedUserIds !== undefined &&
      !isStreamIdList(input.mentionedUserIds))
  ) {
    return fail("Datos inválidos.");
  }

  const session = await memberSession();
  if ("ok" in session) return session;

  const space = findSpace(input.spaceId);
  if (!space) return fail("Ese espacio no existe.");
  if (!canPostIn(space, isAdmin(session.user.email))) {
    return fail(`Solo el equipo puede publicar en ${space.name}.`);
  }

  const text = input.text.trim();
  const { images } = input;
  if (!text && images.length === 0) {
    return fail("Escribe algo o agrega una imagen.");
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return fail(`Máximo ${MAX_TEXT_LENGTH} caracteres.`);
  }
  if (images.length > MAX_IMAGES || !images.every(isStreamCdnUrl)) {
    return fail(`Puedes adjuntar hasta ${MAX_IMAGES} imágenes.`);
  }

  const { streamId } = session.user;
  if (!(await takeRateLimit("post", streamId))) {
    return fail("Publicaste varias veces seguidas. Espera unos minutos.");
  }
  const mentionedUserIds = await validMentions(
    input.mentionedUserIds ?? [],
    streamId,
  );

  try {
    await stream.feeds.addActivity({
      type: "post",
      feeds: [spaceFid(space.id), profileFid(streamId)],
      user_id: streamId,
      text,
      attachments: images.map((url) => ({
        type: "image",
        image_url: url,
        custom: {},
      })),
      mentioned_user_ids: mentionedUserIds,
      // Solo crea notificaciones para los mencionados.
      create_notification_activity: mentionedUserIds.length > 0,
    });
    return { ok: true };
  } catch (error) {
    console.error("[stream] no se pudo publicar", error);
    return fail("No pudimos publicar. Inténtalo de nuevo.");
  }
}

// Los comentarios también pasan por el servidor: los miembros no tienen el
// permiso `add-comment` en Stream (lo quita `stream:setup`), así que es la
// única vía. Valida largo, menciones, bloqueo y frecuencia.
export async function addComment(input: {
  activityId: string;
  text: string;
  /** Comentario al que responde (las respuestas cuelgan del raíz). */
  parentId?: string;
  mentionedUserIds?: string[];
}): Promise<ActionResult> {
  if (
    typeof input?.activityId !== "string" ||
    typeof input.text !== "string" ||
    (input.parentId !== undefined && typeof input.parentId !== "string") ||
    (input.mentionedUserIds !== undefined &&
      !isStreamIdList(input.mentionedUserIds))
  ) {
    return fail("Datos inválidos.");
  }

  const session = await memberSession();
  if ("ok" in session) return session;

  const text = input.text.trim();
  if (!text) return fail("Escribe un comentario.");
  if (text.length > MAX_COMMENT_LENGTH) {
    return fail(`Máximo ${MAX_COMMENT_LENGTH} caracteres.`);
  }

  // La publicación debe existir (y no estar eliminada); una respuesta debe
  // ser de un comentario de esa misma publicación.
  const activity = await stream.feeds
    .getActivity({ id: input.activityId })
    .then(({ activity }) => activity)
    .catch(() => undefined);
  if (!activity || activity.type !== "post") {
    return fail("Esta publicación ya no existe.");
  }
  // Las respuestas cuelgan del comentario raíz (un nivel de hilo). Quien
  // recibe la notificación es el autor del raíz o, si no es respuesta, el
  // autor de la publicación.
  let parentId: string | undefined;
  let notifyUserId = activity.user.id;
  if (input.parentId) {
    let parent = await findComment(input.parentId);
    if (parent?.parent_id) parent = await findComment(parent.parent_id);
    if (!parent || parent.object_id !== activity.id) {
      return fail("Ese comentario ya no existe.");
    }
    parentId = parent.id;
    notifyUserId = parent.user.id;
  }

  const { streamId } = session.user;
  if (!(await takeRateLimit("comment", streamId))) {
    return fail("Comentaste varias veces seguidas. Espera unos minutos.");
  }
  const mentionedUserIds = await validMentions(
    input.mentionedUserIds ?? [],
    streamId,
  );

  // Si el destinatario ya no existe, Stream crea el comentario y luego falla
  // al notificar (no es atómico): se comprueba antes en lugar de reintentar,
  // que duplicaría el comentario.
  const notify = notifyUserId === streamId || (await userExists(notifyUserId));

  try {
    await stream.feeds.addComment({
      object_id: activity.id,
      object_type: "activity",
      comment: text,
      parent_id: parentId,
      user_id: streamId,
      mentioned_user_ids: mentionedUserIds,
      // Avisa al autor del post (o del comentario, si es respuesta) y a los
      // mencionados; Stream no notifica las acciones propias.
      create_notification_activity: notify,
    });
    return { ok: true };
  } catch (error) {
    console.error("[stream] no se pudo comentar", error);
    return fail("No pudimos enviar tu comentario. Inténtalo de nuevo.");
  }
}

const findComment = (id: string) =>
  stream.feeds
    .getComment({ id })
    .then(({ comment }) => comment)
    .catch(() => undefined);

const userExists = async (id: string) => {
  const { users } = await stream.queryUsers({
    payload: { filter_conditions: { id: { $eq: id } }, limit: 1 },
  });
  return users.length > 0;
};
