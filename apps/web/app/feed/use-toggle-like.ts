"use client";

import { useRef } from "react";
import {
  useFeedsClient,
  type ActivityResponse,
} from "@stream-io/feeds-react-sdk";

const LIKE = "like";

export const isLikedByMe = (activity: ActivityResponse) =>
  activity.own_reactions.some((reaction) => reaction.type === LIKE);

// Da o quita "me gusta" a una actividad. El SDK actualiza `own_reactions` y
// los contadores en su estado; aquí solo se evita el doble clic mientras la
// petición está en curso.
export const useToggleLike = () => {
  const client = useFeedsClient();
  const pending = useRef(new Set<string>());

  return async (activity: ActivityResponse) => {
    if (!client || pending.current.has(activity.id)) return;
    pending.current.add(activity.id);
    try {
      if (isLikedByMe(activity)) {
        await client.deleteActivityReaction({
          activity_id: activity.id,
          type: LIKE,
        });
      } else {
        await client.addActivityReaction({
          activity_id: activity.id,
          type: LIKE,
          enforce_unique: true,
        });
      }
    } catch (error) {
      console.error("[stream] no se pudo actualizar el me gusta", error);
    } finally {
      pending.current.delete(activity.id);
    }
  };
};
