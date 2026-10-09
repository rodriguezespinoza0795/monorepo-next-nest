import "server-only";
import type { ActivityResponse } from "@stream-io/node-sdk";
import { isUploadedImage, linkPreviewsOf } from "@repo/community/attachments";
import { stream } from "@repo/community/stream";

const SYSTEM_USER_ID = "system";

/** Nombre de cada espacio (`space:<id>` → "General"), leído de Stream. */
export const getSpaceNames = async () => {
  const { feeds } = await stream.feeds.queryFeeds({
    filter: { group_id: "space" },
    limit: 25,
  });
  return new Map(feeds.map((feed) => [feed.feed, feed.name ?? feed.id]));
};

/** Props de `PostCard` para una publicación (solo lectura en el panel). */
export const toPostCard = (
  activity: ActivityResponse,
  spaceNames: Map<string, string>,
) => ({
  author: {
    name: activity.user.name ?? activity.user.id,
    image: activity.user.image,
  },
  createdAt: new Date(activity.created_at),
  text: activity.text,
  mentions: activity.mentioned_users.map((user) => ({
    name: user.name ?? user.id,
  })),
  space: activity.feeds
    .map((fid) => spaceNames.get(fid))
    .find((name) => name !== undefined),
  images: activity.attachments.filter(isUploadedImage).map((attachment) => ({
    url: attachment.image_url,
    alt: attachment.title,
  })),
  linkPreviews: linkPreviewsOf(activity.attachments, activity.text),
  reactionCount: activity.reaction_groups.like?.count ?? 0,
  commentCount: activity.comment_count,
});

/** Autor que se puede bloquear: ni el sistema ni quien modera. */
export const bannableAuthor = (
  user: { id: string; name?: string },
  moderatorId: string,
) =>
  user.id === SYSTEM_USER_ID || user.id === moderatorId
    ? undefined
    : { id: user.id, name: user.name ?? user.id };

const DELETED_SCAN_PAGES = 5;
const DELETED_SCAN_PAGE_SIZE = 100;

/**
 * Publicaciones eliminadas (borrado suave), de la más reciente a la más
 * antigua. Stream no deja filtrar por `deleted_at`, así que se revisan las
 * últimas 500 publicaciones (incluidas las eliminadas) y se quedan las
 * borradas.
 */
export const getDeletedPosts = async () => {
  const deleted: ActivityResponse[] = [];
  let next: string | undefined;
  for (let page = 0; page < DELETED_SCAN_PAGES; page++) {
    const response = await stream.feeds.queryActivities({
      filter: { activity_type: "post" },
      include_soft_deleted_activities: true,
      sort: [{ field: "created_at", direction: -1 }],
      limit: DELETED_SCAN_PAGE_SIZE,
      next,
    });
    deleted.push(...response.activities.filter((a) => a.deleted_at));
    next = response.next;
    if (!next) break;
  }
  return deleted.sort(
    (a, b) =>
      new Date(b.deleted_at ?? 0).getTime() -
      new Date(a.deleted_at ?? 0).getTime(),
  );
};

/** La publicación solo si está eliminada (borrado suave). */
export const findDeletedPost = async (id: string) => {
  const { activities } = await stream.feeds.queryActivities({
    filter: { id: { $eq: id } },
    include_soft_deleted_activities: true,
    limit: 1,
  });
  const activity = activities[0];
  return activity?.deleted_at ? activity : undefined;
};
