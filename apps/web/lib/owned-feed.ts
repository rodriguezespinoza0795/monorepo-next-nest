import type { StreamClient } from "@stream-io/node-sdk";

// Obtiene o crea un feed asegurando su dueño. Stream deja a cualquier usuario
// crear un feed que aún no existe y lo deja como dueño (con permiso para
// publicar en él). Si alguien se adelantó, el feed se transfiere al dueño
// correcto y se borran las publicaciones que no sean del autor legítimo.
// Devuelve si el feed se creó en esta llamada.
export const getOrCreateOwnedFeed = async (
  client: StreamClient,
  {
    group,
    id,
    ownerId,
    authorId,
  }: {
    group: string;
    id: string;
    /** Dueño esperado del feed. */
    ownerId: string;
    /**
     * Único autor cuyas publicaciones pueden estar en este feed. Sin él (por
     * ejemplo, en notificaciones, que crean otros) solo se transfiere.
     */
    authorId?: string;
  },
) => {
  const response = await client.feeds.getOrCreateFeed({
    feed_group_id: group,
    feed_id: id,
    user_id: ownerId,
  });
  const currentOwner = response.feed.created_by.id;
  if (currentOwner === ownerId) return response.created;

  console.warn(
    `[stream] ${group}:${id} tenía otro dueño (${currentOwner}); se transfiere a ${ownerId}`,
  );
  await client.feeds.updateFeed({
    feed_group_id: group,
    feed_id: id,
    created_by_id: ownerId,
  });
  if (authorId === undefined) return false;

  const { activities } = await client.feeds.getOrCreateFeed({
    feed_group_id: group,
    feed_id: id,
    user_id: ownerId,
    limit: 100,
  });
  // Solo las publicadas directamente en este feed: un timeline también trae
  // las de los feeds que sigue (de otros autores) y esas no se tocan.
  const fid = `${group}:${id}`;
  const intruders = activities.filter(
    (activity) => activity.feeds.includes(fid) && activity.user.id !== authorId,
  );
  await Promise.all(
    intruders.map((activity) =>
      client.feeds.deleteActivity({ id: activity.id, hard_delete: true }),
    ),
  );
  return false;
};
