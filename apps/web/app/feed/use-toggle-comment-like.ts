"use client";

import { useRef } from "react";
import {
  useFeedsClient,
  type CommentResponse,
} from "@stream-io/feeds-react-sdk";
import { withNotificationFallback } from "../../lib/notifications";
import { reportError } from "../../lib/report-error";

const LIKE = "like";

export const isCommentLikedByMe = (comment: CommentResponse) =>
  comment.own_reactions.some((reaction) => reaction.type === LIKE);

export const commentLikeCount = (comment: CommentResponse) =>
  comment.reaction_groups?.[LIKE]?.count ?? 0;

// "Me gusta" en comentarios y respuestas, como en las publicaciones: directo
// con el SDK (los miembros tienen `add-comment-reaction`), uno por persona
// (`enforce_unique`) y con aviso al autor del comentario.
export const useToggleCommentLike = () => {
  const client = useFeedsClient();
  const pending = useRef(new Set<string>());

  return async (comment: CommentResponse) => {
    if (!client || pending.current.has(comment.id)) return;
    pending.current.add(comment.id);
    try {
      if (isCommentLikedByMe(comment)) {
        await client.deleteCommentReaction({
          id: comment.id,
          type: LIKE,
          delete_notification_activity: true,
        });
      } else {
        await withNotificationFallback((notify) =>
          client.addCommentReaction({
            id: comment.id,
            type: LIKE,
            enforce_unique: true,
            create_notification_activity: notify,
          }),
        );
      }
    } catch (error) {
      reportError("[stream] no se pudo actualizar el me gusta", error);
    } finally {
      pending.current.delete(comment.id);
    }
  };
};
