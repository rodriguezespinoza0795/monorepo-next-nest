"use client";

import Link from "next/link";
import type { ActivityResponse } from "@stream-io/feeds-react-sdk";
import { PostCard } from "@repo/ui/feed/post-card";
import { findSpace } from "../../lib/spaces";
import { isLikedByMe, useToggleLike } from "./use-toggle-like";

// Nombre del espacio donde se publicó la actividad (`space:<id>`).
const spaceName = (activity: ActivityResponse) => {
  const fid = activity.feeds.find((feed) => feed.startsWith("space:"));
  return fid ? findSpace(fid.slice("space:".length))?.name : undefined;
};

const imagesOf = (activity: ActivityResponse) =>
  activity.attachments
    .filter((attachment) => attachment.type === "image" && attachment.image_url)
    .map((attachment) => ({
      url: attachment.image_url as string,
      alt: attachment.title,
    }));

interface ActivityPostCardProps {
  activity: ActivityResponse;
  showSpace?: boolean;
  /** Enlaza al detalle del post (en la lista; no en el propio detalle). */
  linkToDetail?: boolean;
}

export const ActivityPostCard = ({
  activity,
  showSpace = false,
  linkToDetail = false,
}: ActivityPostCardProps) => {
  const toggleLike = useToggleLike();

  return (
    <PostCard
      author={{
        name: activity.user.name ?? activity.user.id,
        image: activity.user.image,
      }}
      createdAt={new Date(activity.created_at)}
      text={activity.text}
      space={showSpace ? spaceName(activity) : undefined}
      images={imagesOf(activity)}
      reactionCount={activity.reaction_groups.like?.count ?? 0}
      commentCount={activity.comment_count}
      liked={isLikedByMe(activity)}
      onToggleLike={() => void toggleLike(activity)}
      href={linkToDetail ? `/feed/post/${activity.id}` : undefined}
      linkComponent={Link}
    />
  );
};
