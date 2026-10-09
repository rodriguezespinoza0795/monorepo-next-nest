import "server-only";
import { syncStreamUser } from "@repo/community/users";
import { SYSTEM_USER_ID, spaceFid, timelineFid } from "./feeds";
import { getOrCreateOwnedFeed } from "./owned-feed";
import { SPACES } from "./spaces";
import { stream } from "./stream";

interface StreamUser {
  id: string;
  name: string;
  image?: string | null;
}

// Deja listo a un usuario en Stream: perfil de usuario, su `timeline` y sus
// `notification` (suyos) y su feed de perfil (`profile`, de `system`). Es
// idempotente: sin base de datos se ejecuta en cada inicio de sesión tras
// reiniciar el servidor.
//
// Solo cuando se crea el timeline se une a todos los espacios; después
// respeta los que el miembro haya abandonado.
export const onboardStreamUser = async ({ id, name, image }: StreamUser) => {
  await syncStreamUser({ id, name, image });

  const [timelineCreated] = await Promise.all([
    getOrCreateOwnedFeed(stream, {
      group: "timeline",
      id,
      ownerId: id,
      authorId: id,
    }),
    getOrCreateOwnedFeed(stream, {
      group: "profile",
      id,
      ownerId: SYSTEM_USER_ID,
      authorId: id,
    }),
    // Notificaciones del miembro (comentarios, reacciones y menciones).
    getOrCreateOwnedFeed(stream, {
      group: "notification",
      id,
      ownerId: id,
    }),
  ]);

  if (timelineCreated) {
    await stream.feeds.getOrCreateFollows({
      follows: SPACES.map((space) => ({
        source: timelineFid(id),
        target: spaceFid(space.id),
      })),
    });
  }
};
