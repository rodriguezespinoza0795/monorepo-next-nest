"use client";

import { useRef } from "react";
import {
  useFeedsClient,
  type ActivityResponse,
} from "@stream-io/feeds-react-sdk";
import { withNotificationFallback } from "../../lib/notifications";

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
          delete_notification_activity: true,
        });
      } else {
        await withNotificationFallback((notify) =>
          client.addActivityReaction({
            activity_id: activity.id,
            type: LIKE,
            enforce_unique: true,
            // Avisa al autor (Stream no notifica los likes propios).
            create_notification_activity: notify,
          }),
        );
      }
    } catch (error) {
      console.error("[stream] no se pudo actualizar el me gusta", error);
    } finally {
      pending.current.delete(activity.id);
    }
  };
};
