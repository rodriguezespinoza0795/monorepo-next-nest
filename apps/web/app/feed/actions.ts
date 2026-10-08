"use server";

import { headers } from "next/headers";
import { isAdmin } from "../../lib/admins";
import { auth } from "../../lib/auth";
import { takeRateLimit } from "../../lib/rate-limit";
import { canPostIn, findSpace } from "../../lib/spaces";
import { stream } from "../../lib/stream";

const MAX_TEXT_LENGTH = 5000;
const MAX_IMAGES = 4;
const POSTS_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;

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
}): Promise<CreatePostResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return { ok: false, error: "Tu sesión expiró. Vuelve a entrar." };

  // Una server action es un endpoint público: no confiar en los tipos.
  if (
    typeof input?.spaceId !== "string" ||
    typeof input.text !== "string" ||
    !Array.isArray(input.images) ||
    !input.images.every((image) => typeof image === "string")
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

  try {
    await stream.feeds.addActivity({
      type: "post",
      feeds: [`space:${space.id}`, `user:${streamId}`],
      user_id: streamId,
      text,
      attachments: images.map((url) => ({
        type: "image",
        image_url: url,
        custom: {},
      })),
    });
    return { ok: true };
  } catch (error) {
    console.error("[stream] no se pudo publicar", error);
    return { ok: false, error: "No pudimos publicar. Inténtalo de nuevo." };
  }
}
