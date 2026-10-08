import "server-only";
import { SPACES } from "./spaces";
import { stream } from "./stream";

interface StreamUser {
  id: string;
  name: string;
  image?: string | null;
}

// Deja listo a un usuario en Stream: perfil, sus feeds `user` y `timeline`, y
// el timeline siguiendo todos los espacios. Es idempotente.
export const onboardStreamUser = async ({ id, name, image }: StreamUser) => {
  await stream.upsertUsers([{ id, name, image: image ?? undefined }]);

  await Promise.all(
    ["user", "timeline"].map((group) =>
      stream.feeds.getOrCreateFeed({
        feed_group_id: group,
        feed_id: id,
        user_id: id,
      }),
    ),
  );

  await stream.feeds.getOrCreateFollows({
    follows: SPACES.map((space) => ({
      source: `timeline:${id}`,
      target: `space:${space.id}`,
    })),
  });
};
