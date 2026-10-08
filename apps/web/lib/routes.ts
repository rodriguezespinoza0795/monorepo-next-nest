import { SYSTEM_USER_ID } from "./feeds";

export const postHref = (activityId: string) => `/feed/post/${activityId}`;

/** Perfil de un miembro; el usuario `system` no tiene perfil. */
export const profileHref = (userId: string) =>
  userId === SYSTEM_USER_ID
    ? undefined
    : `/feed/u/${encodeURIComponent(userId)}`;
