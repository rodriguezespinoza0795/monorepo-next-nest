import "server-only";
import type { ActivityResponse } from "@stream-io/node-sdk";
import { stream } from "./stream";

// Búsqueda de publicaciones y miembros (por el servidor, con el secreto, para
// decidir qué se puede encontrar). Stream `$autocomplete` busca prefijos sin
// distinguir mayúsculas ni acentos ("fotog" → "fotografía"), pero con varias
// palabras solo trata la última como prefijo: por eso va un `$autocomplete`
// por palabra, unidos con `$and` (todas deben aparecer, en cualquier orden).
// La usan la comunidad (`web`) y el panel de moderación (`admin`).

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;
const PAGE_SIZE = 20;
const MAX_WORDS = 5;
const SYSTEM_USER_ID = "system";

/** Consulta limpia, o `null` si es demasiado corta para buscar. */
export const normalizeQuery = (raw: unknown) => {
  if (typeof raw !== "string") return null;
  const query = raw.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
  return query.length >= MIN_QUERY_LENGTH ? query : null;
};

const byWord = (field: string, query: string) =>
  [...new Set(query.toLowerCase().split(" "))]
    .slice(0, MAX_WORDS)
    .map((word) => ({ [field]: { $autocomplete: word } }));

interface SearchOptions {
  /** El panel de moderación también ve a los miembros bloqueados. */
  includeBanned?: boolean;
}

/**
 * Publicaciones de los espacios que coinciden con `query` y/o son de
 * `authorId`, de la más reciente a la más antigua. Las eliminadas (borrado
 * suave) Stream ya las excluye.
 */
export const searchPosts = async ({
  query,
  authorId,
  next,
  includeBanned = false,
}: SearchOptions & { query?: string; authorId?: string; next?: string }) => {
  const conditions: Record<string, unknown>[] = [
    { activity_type: "post" },
    ...(query ? byWord("text", query) : []),
    ...(authorId ? [{ user_id: authorId }] : []),
  ];
  const response = await stream.feeds.queryActivities({
    filter: { $and: conditions },
    sort: [{ field: "created_at", direction: -1 }],
    limit: PAGE_SIZE,
    next,
  });
  const visible = (activity: ActivityResponse) =>
    activity.type === "post" &&
    activity.feeds.some((fid) => fid.startsWith("space:")) &&
    (includeBanned || !activity.user.banned);
  return {
    posts: response.activities.filter(visible),
    next: response.next,
  };
};

/** Miembros cuyo nombre coincide (sin `system`; bloqueados según opción). */
export const searchMembers = async (
  query: string,
  { includeBanned = false }: SearchOptions = {},
) => {
  const { users } = await stream.queryUsers({
    payload: {
      filter_conditions: { $and: byWord("name", query) },
      sort: [{ field: "name", direction: 1 }],
      limit: PAGE_SIZE + 1,
    },
  });
  return users
    .filter(
      (user) => user.id !== SYSTEM_USER_ID && (includeBanned || !user.banned),
    )
    .slice(0, PAGE_SIZE);
};

/** Un miembro por id (para mostrar "Publicaciones de …"). */
export const findUser = async (id: string) => {
  const { users } = await stream.queryUsers({
    payload: { filter_conditions: { id: { $eq: id } }, limit: 1 },
  });
  return users[0];
};
