"use client";

import { useEffect, useRef, useState } from "react";
import {
  useClientConnectedUser,
  useFeedsClient,
} from "@stream-io/feeds-react-sdk";
import type { MentionUser } from "@repo/ui/feed/mention-text-field";
import { SYSTEM_USER_ID } from "../../lib/feeds";

const MAX_SUGGESTIONS = 6;
const DEBOUNCE_MS = 150;

// Autocompletado de @menciones para un composer: busca miembros por nombre y
// recuerda a quién se eligió. Al publicar, solo cuentan las menciones cuyo
// `@Nombre` sigue en el texto.
export const useMentions = () => {
  const client = useFeedsClient();
  const me = useClientConnectedUser();
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [selected, setSelected] = useState<MentionUser[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onMentionQuery = (query: string | null) => {
    clearTimeout(timer.current);
    const request = ++latest.current;
    if (query === null || !client) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(() => {
      client
        .queryUsers({
          payload: {
            filter_conditions: query ? { name: { $autocomplete: query } } : {},
            limit: MAX_SUGGESTIONS + 2,
          },
        })
        .then(({ users }) => {
          if (request !== latest.current) return;
          setSuggestions(
            users
              .filter(
                (user) => user.id !== me?.id && user.id !== SYSTEM_USER_ID,
              )
              .slice(0, MAX_SUGGESTIONS)
              .map((user) => ({
                id: user.id,
                name: user.name ?? user.id,
                image: user.image,
              })),
          );
        })
        .catch((error: unknown) => {
          console.error("[stream] no se pudo buscar personas", error);
          setSuggestions([]);
        });
    }, DEBOUNCE_MS);
  };

  const onMention = (user: MentionUser) =>
    setSelected((current) =>
      current.some((item) => item.id === user.id)
        ? current
        : [...current, user],
    );

  return {
    suggestions,
    onMentionQuery,
    onMention,
    mentionedIds: (text: string) =>
      selected
        .filter((user) => text.includes(`@${user.name}`))
        .map((user) => user.id),
    reset: () => setSelected([]),
  };
};
