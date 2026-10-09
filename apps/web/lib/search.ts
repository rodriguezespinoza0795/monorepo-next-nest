import "server-only";
import type { ActivityResponse } from "@stream-io/node-sdk";
import { SYSTEM_USER_ID } from "./feeds";
import { SPACES } from "./spaces";
import { stream } from "./stream";

// Búsqueda de publicaciones y miembros (por el servidor, con el secreto, para
// decidir qué se puede encontrar). Stream `$autocomplete` busca prefijos sin
// distinguir mayúsculas ni acentos ("fotog" → "fotografía"), pero con varias
// palabras solo trata la última como prefijo: por eso va un `$autocomplete`
// por palabra, unidos con `$and` (todas deben aparecer, en cualquier orden).

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;
const PAGE_SIZE = 20;
const MAX_WORDS = 5;

const SPACE_FIDS = new Set(SPACES.map((space) => `space:${space.id}`));

/** Consulta limpia, o `null` si es demasiado corta para buscar. */
export const normalizeQuery = (raw: unknown) => {
  if (typeof raw !== "string") return null;
  const query = raw.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
  return query.length >= MIN_QUERY_LENGTH ? query : null;
};

const byWord = (field: string, query: string) => ({
  $and: [...new Set(query.toLowerCase().split(" "))]
    .slice(0, MAX_WORDS)
    .map((word) => ({ [field]: { $autocomplete: word } })),
});

// Solo publicaciones de los espacios (no otras actividades) y nunca de
// miembros bloqueados. Las eliminadas (borrado suave) Stream ya las excluye.
const isSearchable = (activity: ActivityResponse) =>
  activity.type === "post" &&
  activity.feeds.some((fid) => SPACE_FIDS.has(fid)) &&
  !activity.user.banned;

export const searchPosts = async (query: string, next?: string) => {
  const response = await stream.feeds.queryActivities({
    filter: { activity_type: "post", ...byWord("text", query) },
    sort: [{ field: "created_at", direction: -1 }],
    limit: PAGE_SIZE,
    next,
  });
  return {
    posts: response.activities.filter(isSearchable),
    next: response.next,
  };
};

export const searchMembers = async (query: string) => {
  const { users } = await stream.queryUsers({
    payload: {
      filter_conditions: byWord("name", query),
      sort: [{ field: "name", direction: 1 }],
      limit: PAGE_SIZE + 1,
    },
  });
  return users
    .filter((user) => user.id !== SYSTEM_USER_ID && !user.banned)
    .slice(0, PAGE_SIZE);
};
