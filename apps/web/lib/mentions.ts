import "server-only";
import { SYSTEM_USER_ID } from "./feeds";
import { stream } from "./stream";

const MAX_MENTIONS = 10;
const STREAM_ID = /^[A-Za-z0-9_-]{1,64}$/;

export const isStreamIdList = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((id) => typeof id === "string" && STREAM_ID.test(id));

/**
 * Menciones válidas: miembros que existen, sin duplicados, sin el autor ni
 * `system`, con tope. Las inválidas se descartan en silencio.
 */
export const validMentions = async (ids: string[], authorId: string) => {
  const unique = [
    ...new Set(ids.filter((id) => id !== authorId && id !== SYSTEM_USER_ID)),
  ].slice(0, MAX_MENTIONS);
  if (unique.length === 0) return [];
  const { users } = await stream.queryUsers({
    payload: {
      filter_conditions: { id: { $in: unique } },
      limit: unique.length,
    },
  });
  return users.map((user) => user.id);
};
