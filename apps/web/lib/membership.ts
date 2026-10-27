import "server-only";
import { stream } from "./stream";

// Un miembro bloqueado desde el panel de moderación (baneo de Stream). Con su
// token Stream ya le niega todo, pero el servidor usa el SDK con el secreto
// (que no respeta el baneo), así que lo comprueba antes de actuar por él.
export const isBanned = async (streamId: string) =>
  (await getStreamUser(streamId))?.banned ?? false;

/** El usuario en Stream, o `undefined` si todavía no existe. */
export const getStreamUser = async (streamId: string) => {
  const { users } = await stream.queryUsers({
    payload: { filter_conditions: { id: { $eq: streamId } }, limit: 1 },
  });
  return users[0];
};
