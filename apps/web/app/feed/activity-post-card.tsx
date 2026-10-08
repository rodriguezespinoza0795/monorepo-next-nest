"use client";

import Link from "next/link";
import Alert from "@mui/material/Alert";
import {
  useClientConnectedUser,
  type ActivityResponse,
} from "@stream-io/feeds-react-sdk";
import { PostCard } from "@repo/ui/feed/post-card";
import { postHref, profileHref } from "../../lib/routes";
import { findSpace } from "../../lib/spaces";
import { deleteOwnPost, updatePost } from "./actions";
import { useOwnContent } from "./use-own-content";
import { isLikedByMe, useToggleLike } from "./use-toggle-like";

const MAX_TEXT_LENGTH = 5000;

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
  /** Tras editar o eliminar su propio post (para recargar). */
  onChanged?: () => void | Promise<void>;
  /** Tras eliminar su propio post (por defecto, `onChanged`). */
  onDeleted?: () => void | Promise<void>;
}

export const ActivityPostCard = ({
  activity,
  showSpace = false,
  linkToDetail = false,
  onChanged,
  onDeleted = onChanged,
}: ActivityPostCardProps) => {
  const toggleLike = useToggleLike();
  const me = useClientConnectedUser();
  const mentions = activity.mentioned_users.map((user) => ({
    id: user.id,
    name: user.name ?? user.id,
    image: user.image,
  }));
  const own = useOwnContent({
    kind: "post",
    text: activity.text ?? "",
    mentions,
    maxLength: MAX_TEXT_LENGTH,
    save: (text, mentionedUserIds) =>
      updatePost({ activityId: activity.id, text, mentionedUserIds }),
    remove: () => deleteOwnPost(activity.id),
    onSaved: onChanged,
    onDeleted,
  });
  const isMine = me?.id === activity.user.id;

  return (
    <>
      <PostCard
        author={{
          name: activity.user.name ?? activity.user.id,
          image: activity.user.image,
          href: profileHref(activity.user.id),
        }}
        createdAt={new Date(activity.created_at)}
        text={activity.text}
        mentions={mentions.map((user) => ({
          name: user.name,
          href: profileHref(user.id),
        }))}
        space={showSpace ? spaceName(activity) : undefined}
        images={imagesOf(activity)}
        reactionCount={activity.reaction_groups.like?.count ?? 0}
        commentCount={activity.comment_count}
        liked={isLikedByMe(activity)}
        onToggleLike={() => void toggleLike(activity)}
        href={linkToDetail ? postHref(activity.id) : undefined}
        linkComponent={Link}
        edited={Boolean(activity.edited_at)}
        menu={isMine ? own.menu : undefined}
        editor={isMine ? own.editor : undefined}
      />
      {isMine && own.error && <Alert severity="error">{own.error}</Alert>}
      {isMine && own.dialog}
    </>
  );
};
