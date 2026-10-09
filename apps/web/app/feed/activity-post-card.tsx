"use client";

import { useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import { ItemMenu, type ItemMenuAction } from "@repo/ui/feed/item-menu";
import {
  useClientConnectedUser,
  type ActivityResponse,
} from "@stream-io/feeds-react-sdk";
import { PostCard } from "@repo/ui/feed/post-card";
import { isUploadedImage, linkPreviewsOf } from "@repo/community/attachments";
import { isEdited } from "../../lib/edited";
import { postHref, profileHref } from "../../lib/routes";
import { findSpace } from "../../lib/spaces";
import { deleteOwnPost, setPostPinned, updatePost } from "./actions";
import { isSavedByMe, useToggleBookmark } from "./use-toggle-bookmark";
import { useOwnContent } from "./use-own-content";
import { isLikedByMe, useToggleLike } from "./use-toggle-like";

const MAX_TEXT_LENGTH = 5000;

// Nombre del espacio donde se publicó la actividad (`space:<id>`).
const spaceName = (activity: ActivityResponse) => {
  const fid = activity.feeds.find((feed) => feed.startsWith("space:"));
  return fid ? findSpace(fid.slice("space:".length))?.name : undefined;
};

const imagesOf = (activity: ActivityResponse) =>
  activity.attachments.filter(isUploadedImage).map((attachment) => ({
    url: attachment.image_url,
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
  /** Se muestra como "Destacado" de su espacio. */
  pinned?: boolean;
  /** Admin: ofrece destacar / quitar el destacado en el menú. */
  canPin?: boolean;
  /** Tras cambiar el destacado (para recargar el feed). */
  onPinChanged?: () => void | Promise<void>;
}

// Una vez visto como editado, o con el texto cambiado en pantalla, la marca
// se mantiene: el evento en tiempo real puede reemplazar la actividad con
// datos parciales después de la recarga (ajuste de estado en el render).
const useEditedLatch = (activity: ActivityResponse) => {
  const [firstText] = useState(activity.text);
  const [seen, setSeen] = useState(isEdited(activity));
  const editedNow = isEdited(activity) || activity.text !== firstText;
  if (editedNow && !seen) setSeen(true);
  return seen || editedNow;
};

export const ActivityPostCard = ({
  activity,
  showSpace = false,
  linkToDetail = false,
  onChanged,
  onDeleted = onChanged,
  pinned = false,
  canPin = false,
  onPinChanged,
}: ActivityPostCardProps) => {
  const toggleLike = useToggleLike();
  const toggleBookmark = useToggleBookmark();
  const [pinError, setPinError] = useState<string | null>(null);
  const me = useClientConnectedUser();
  const edited = useEditedLatch(activity);
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

  const togglePin = async () => {
    setPinError(null);
    const result = await setPostPinned(activity.id, !pinned).catch(() => ({
      ok: false as const,
      error: "No pudimos cambiar el destacado. Inténtalo de nuevo.",
    }));
    if (result.ok) await onPinChanged?.();
    else setPinError(result.error);
  };
  const actions: ItemMenuAction[] = [
    ...(isMine ? own.actions : []),
    ...(canPin
      ? [
          {
            label: pinned ? "Quitar destacado" : "Destacar en el espacio",
            icon: pinned ? (
              <PushPinIcon fontSize="small" />
            ) : (
              <PushPinOutlinedIcon fontSize="small" />
            ),
            onClick: () => void togglePin(),
          },
        ]
      : []),
  ];

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
        linkPreviews={linkPreviewsOf(activity.attachments, activity.text)}
        reactionCount={activity.reaction_groups.like?.count ?? 0}
        commentCount={activity.comment_count}
        liked={isLikedByMe(activity)}
        onToggleLike={() => void toggleLike(activity)}
        href={linkToDetail ? postHref(activity.id) : undefined}
        linkComponent={Link}
        edited={edited}
        menu={
          actions.length > 0 ? (
            <ItemMenu label="Opciones de la publicación" actions={actions} />
          ) : undefined
        }
        editor={isMine ? own.editor : undefined}
        pinned={pinned}
        saved={isSavedByMe(activity)}
        onToggleSave={() => void toggleBookmark(activity)}
      />
      {isMine && own.error && <Alert severity="error">{own.error}</Alert>}
      {pinError && <Alert severity="error">{pinError}</Alert>}
      {isMine && own.dialog}
    </>
  );
};
