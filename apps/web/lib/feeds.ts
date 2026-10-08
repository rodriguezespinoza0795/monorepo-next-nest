// Ids de usuarios y feeds de Stream que comparten el servidor y los scripts.

/** Usuario técnico dueño de los espacios y de los perfiles. */
export const SYSTEM_USER_ID = "system";

export const spaceFid = (spaceId: string) => `space:${spaceId}`;
export const timelineFid = (streamId: string) => `timeline:${streamId}`;
/**
 * Perfil de un miembro: sus publicaciones. Lo crea y es dueño `system`, así el
 * miembro no puede publicar directo con su token (Stream deja al dueño de un
 * feed publicar en él); sus posts entran solo por `createPost`.
 */
export const profileFid = (streamId: string) => `profile:${streamId}`;
