"use client";

import { useRef } from "react";
import {
  useFeedsClient,
  type ActivityResponse,
} from "@stream-io/feeds-react-sdk";
import { reportError } from "../../lib/report-error";

export const isSavedByMe = (activity: ActivityResponse) =>
  activity.own_bookmarks.length > 0;

// "Guardar" una publicación: bookmark privado de Stream, directo desde el
// navegador como los likes (los miembros tienen `add-bookmark-owner`). El SDK
// actualiza `own_bookmarks` en los feeds abiertos.
export const useToggleBookmark = () => {
  const client = useFeedsClient();
  const pending = useRef(new Set<string>());

  return async (activity: ActivityResponse) => {
    if (!client || pending.current.has(activity.id)) return false;
    pending.current.add(activity.id);
    try {
      if (isSavedByMe(activity)) {
        await client.deleteBookmark({ activity_id: activity.id });
      } else {
        await client.addBookmark({ activity_id: activity.id });
      }
      return true;
    } catch (error) {
      reportError("[stream] no se pudo actualizar el guardado", error);
      return false;
    } finally {
      pending.current.delete(activity.id);
    }
  };
};
