"use server";

import { headers } from "next/headers";
import { isAdmin } from "../../lib/admins";
import { profileFid, spaceFid, SYSTEM_USER_ID } from "../../lib/feeds";
import { auth } from "../../lib/auth";
import { takeRateLimit } from "../../lib/rate-limit";
import { canPostIn, findSpace } from "../../lib/spaces";
import { stream } from "../../lib/stream";

const MAX_TEXT_LENGTH = 5000;
const MAX_IMAGES = 4;
const POSTS_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_MENTIONS = 10;
const STREAM_ID = /^[A-Za-z0-9_-]{1,64}$/;

export type CreatePostResult = { ok: true } | { ok: false; error: string };

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
}): Promise<CreatePostResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return { ok: false, error: "Tu sesión expiró. Vuelve a entrar." };

  // Una server action es un endpoint público: no confiar en los tipos.
  if (
    typeof input?.spaceId !== "string" ||
    typeof input.text !== "string" ||
    !Array.isArray(input.images) ||
    !input.images.every((image) => typeof image === "string") ||
    (input.mentionedUserIds !== undefined &&
      (!Array.isArray(input.mentionedUserIds) ||
        !input.mentionedUserIds.every(
          (id) => typeof id === "string" && STREAM_ID.test(id),
        )))
  ) {
    return { ok: false, error: "Datos inválidos." };
  }

  const space = findSpace(input.spaceId);
  if (!space) return { ok: false, error: "Ese espacio no existe." };
  if (!canPostIn(space, isAdmin(session.user.email))) {
    return {
      ok: false,
      error: `Solo el equipo puede publicar en ${space.name}.`,
    };
  }

  const text = input.text.trim();
  const { images } = input;
  if (!text && images.length === 0) {
    return { ok: false, error: "Escribe algo o agrega una imagen." };
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return { ok: false, error: `Máximo ${MAX_TEXT_LENGTH} caracteres.` };
  }
  if (images.length > MAX_IMAGES || !images.every(isStreamCdnUrl)) {
    return {
      ok: false,
      error: `Puedes adjuntar hasta ${MAX_IMAGES} imágenes.`,
    };
  }

  const { streamId } = session.user;
  if (!takeRateLimit(`post:${streamId}`, POSTS_PER_WINDOW, WINDOW_MS)) {
    return {
      ok: false,
      error: "Publicaste varias veces seguidas. Espera unos minutos.",
    };
  }

  const mentionedUserIds = await existingMembers(
    (input.mentionedUserIds ?? []).filter(
      (id) => id !== streamId && id !== SYSTEM_USER_ID,
    ),
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
    return { ok: false, error: "No pudimos publicar. Inténtalo de nuevo." };
  }
}

// Deja solo ids de miembros que existen (sin duplicados, con tope).
const existingMembers = async (ids: string[]) => {
  const unique = [...new Set(ids)].slice(0, MAX_MENTIONS);
  if (unique.length === 0) return [];
  const { users } = await stream.queryUsers({
    payload: {
      filter_conditions: { id: { $in: unique } },
      limit: unique.length,
    },
  });
  return users.map((user) => user.id);
};
