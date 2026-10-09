import "server-only";
import { SYSTEM_USER_ID } from "./feeds";
import { SPACES } from "./spaces";
import { stream } from "./stream";

// Punto de "publicaciones nuevas" junto a cada espacio del que el miembro
// forma parte (sin notificaciones por cada post). La última visita a cada
// espacio se guarda en el usuario de Stream (`custom.space_seen`): sirve en
// cualquier dispositivo, sin base de datos y sin gastar actividades.

const SEEN_FIELD = "space_seen";
// Stream no deja excluir al autor en la consulta: se leen las últimas y se
// toma la primera de otra persona.
const LATEST_SCAN = 5;

type SeenMap = Record<string, string>;

const getUser = async (streamId: string) => {
  const { users } = await stream.queryUsers({
    payload: { filter_conditions: { id: { $eq: streamId } }, limit: 1 },
  });
  return users[0];
};

const seenOf = (custom: Record<string, unknown> | undefined): SeenMap => {
  const value = custom?.[SEEN_FIELD];
  return value && typeof value === "object" ? (value as SeenMap) : {};
};

/** Ids de los espacios (de los que es miembro) con posts nuevos de otros. */
export const getUnreadSpaceIds = async (streamId: string) => {
  const [user, { follows }] = await Promise.all([
    getUser(streamId),
    stream.feeds.queryFollows({
      filter: { source_feed: `timeline:${streamId}` },
      limit: 25,
    }),
  ]);
  if (!user) return [];
  const joined = new Set(follows.map((follow) => follow.target_feed.feed));
  const seen = seenOf(user.custom);
  // Sin visita registrada: cuenta desde que se creó la cuenta.
  const since = (spaceId: string) =>
    new Date(seen[spaceId] ?? user.created_at).getTime();

  const unread = await Promise.all(
    SPACES.filter((space) => joined.has(`space:${space.id}`)).map(
      async (space) => {
        const { activities } = await stream.feeds.getOrCreateFeed({
          feed_group_id: "space",
          feed_id: space.id,
          // Como su dueño (`system`): nunca crea el feed a nombre del miembro.
          user_id: SYSTEM_USER_ID,
          limit: LATEST_SCAN,
        });
        const latest = activities.find(
          (activity) =>
            activity.type === "post" &&
            activity.user.id !== streamId &&
            !activity.deleted_at,
        );
        return latest && new Date(latest.created_at).getTime() > since(space.id)
          ? space.id
          : undefined;
      },
    ),
  );
  return unread.filter((id): id is string => id !== undefined);
};

/** Registra la visita al espacio (apaga su punto). */
export const markSpaceSeen = async (streamId: string, spaceId: string) => {
  const user = await getUser(streamId);
  if (!user) return;
  await stream.updateUsersPartial({
    users: [
      {
        id: streamId,
        set: {
          [SEEN_FIELD]: {
            ...seenOf(user.custom),
            [spaceId]: new Date().toISOString(),
          },
        },
      },
    ],
  });
};
