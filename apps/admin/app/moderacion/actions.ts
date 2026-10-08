"use server";

import { revalidatePath } from "next/cache";
import { stream } from "@repo/community/stream";
import { findDeletedPost } from "../../lib/community-data";
import { requireAdmin } from "../../lib/session";

// Acciones de moderación. Usan el cliente de servidor de Stream (que pasa por
// encima de los permisos), así que cada una verifica antes que quien llama sea
// administrador. Ver docs/reglas-de-negocio.md.

export type ModerationResult = { ok: true } | { ok: false; error: string };

const SYSTEM_USER_ID = "system";
const STREAM_ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_REASON_LENGTH = 300;

const run = async (
  label: string,
  action: () => Promise<unknown>,
): Promise<ModerationResult> => {
  try {
    await action();
    revalidatePath("/moderacion", "layout");
    return { ok: true };
  } catch (error) {
    console.error(`[moderación] ${label} falló`, error);
    return { ok: false, error: "No se pudo completar la acción." };
  }
};

/** Elimina una publicación (borrado suave: desaparece de todos los feeds). */
export async function deletePost(activityId: string) {
  const admin = await requireAdmin();
  if (typeof activityId !== "string" || !activityId) {
    return { ok: false, error: "Datos inválidos." } as const;
  }
  return run("eliminar publicación", async () => {
    await stream.feeds.deleteActivity({ id: activityId });
    console.info(`[moderación] ${admin.user.email} eliminó ${activityId}`);
  });
}

/** Elimina un comentario (sus respuestas siguen, colgando del hilo). */
export async function deleteComment(commentId: string) {
  const admin = await requireAdmin();
  if (typeof commentId !== "string" || !commentId) {
    return { ok: false, error: "Datos inválidos." } as const;
  }
  return run("eliminar comentario", async () => {
    await stream.feeds.deleteComment({ id: commentId });
    console.info(`[moderación] ${admin.user.email} eliminó ${commentId}`);
  });
}

/**
 * Bloquea a un miembro en toda la app de Stream: con su token ya no puede
 * leer, comentar ni reaccionar (403), y `createPost` en `web` lo rechaza.
 */
export async function banUser(userId: string, reason: string) {
  const admin = await requireAdmin();
  if (
    typeof userId !== "string" ||
    !STREAM_ID.test(userId) ||
    typeof reason !== "string"
  ) {
    return { ok: false, error: "Datos inválidos." } as const;
  }
  if (userId === SYSTEM_USER_ID || userId === admin.user.streamId) {
    return { ok: false, error: "No puedes bloquear esta cuenta." } as const;
  }
  return run("bloquear", async () => {
    // El admin queda como autor del baneo: debe existir como usuario.
    await stream.upsertUsers([
      { id: admin.user.streamId, name: admin.user.name },
    ]);
    await stream.moderation.ban({
      target_user_id: userId,
      banned_by_id: admin.user.streamId,
      reason: reason.trim().slice(0, MAX_REASON_LENGTH) || undefined,
    });
    console.info(`[moderación] ${admin.user.email} bloqueó ${userId}`);
  });
}

export async function unbanUser(userId: string) {
  const admin = await requireAdmin();
  if (typeof userId !== "string" || !STREAM_ID.test(userId)) {
    return { ok: false, error: "Datos inválidos." } as const;
  }
  return run("desbloquear", async () => {
    await stream.moderation.unban({
      target_user_id: userId,
      unbanned_by_id: admin.user.streamId,
    });
    console.info(`[moderación] ${admin.user.email} desbloqueó ${userId}`);
  });
}

/** Restaura una publicación eliminada: vuelve a los feeds con sus comentarios. */
export async function restorePost(activityId: string) {
  const admin = await requireAdmin();
  if (typeof activityId !== "string" || !(await findDeletedPost(activityId))) {
    return { ok: false, error: "Esa publicación no está eliminada." } as const;
  }
  return run("restaurar publicación", async () => {
    await stream.feeds.restoreActivity({ id: activityId });
    console.info(`[moderación] ${admin.user.email} restauró ${activityId}`);
  });
}

/**
 * Borra para siempre una publicación ya eliminada (no se puede deshacer). Solo
 * aplica a eliminadas, para que nunca sea el primer paso.
 */
export async function purgePost(activityId: string) {
  const admin = await requireAdmin();
  if (typeof activityId !== "string" || !(await findDeletedPost(activityId))) {
    return { ok: false, error: "Esa publicación no está eliminada." } as const;
  }
  return run("eliminar definitivamente", async () => {
    await stream.feeds.deleteActivity({ id: activityId, hard_delete: true });
    console.info(
      `[moderación] ${admin.user.email} eliminó definitivamente ${activityId}`,
    );
  });
}
