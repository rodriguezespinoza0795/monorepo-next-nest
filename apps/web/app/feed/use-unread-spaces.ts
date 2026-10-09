"use client";

import { useEffect, useRef, useState } from "react";
import { findSpace } from "../../lib/spaces";
import { getUnreadSpaces, visitSpace } from "./space-activity-actions";

const REFRESH_MS = 60_000;

const spaceIdOf = (pathname: string) => {
  const match = /^\/feed\/([^/]+)$/.exec(pathname);
  return match?.[1] && findSpace(match[1]) ? match[1] : undefined;
};

/**
 * Espacios con publicaciones nuevas. Entrar a un espacio (y salir de él, por
 * lo que llegó en vivo mientras estaba abierto) lo marca como visto. Se
 * actualiza al navegar, al volver a la pestaña y cada minuto si está visible.
 */
export const useUnreadSpaces = (pathname: string) => {
  const [unread, setUnread] = useState<string[]>([]);
  const previous = useRef<string | undefined>(undefined);
  // Solo se aplica la respuesta más reciente.
  const latest = useRef(0);
  const current = spaceIdOf(pathname);

  useEffect(() => {
    const load = () => {
      const id = ++latest.current;
      void (current ? visitSpace(current) : getUnreadSpaces()).then((ids) => {
        if (id === latest.current) setUnread(ids);
      });
    };

    const left = previous.current;
    previous.current = current;
    if (left && left !== current) void visitSpace(left);
    load();

    const refresh = () => {
      if (document.visibilityState === "visible") load();
    };
    const timer = setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [current]);

  return new Set(unread);
};
