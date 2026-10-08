// Stream rechaza crear la notificación cuando su destinatario ya no existe
// (por ejemplo, el autor del post fue borrado), pero la acción ya quedó
// hecha: no es atómico. Reintentar sin notificación solo es seguro en
// acciones idempotentes, como un like con `enforce_unique` (lo reemplaza en
// vez de duplicarlo). Los comentarios comprueban el destinatario antes.
export const isMissingNotificationTarget = (error: unknown) =>
  error instanceof Error &&
  error.message.includes("target user is required for notification activity");

export const withNotificationFallback = async <T>(
  run: (notify: boolean) => Promise<T>,
) => {
  try {
    return await run(true);
  } catch (error) {
    if (!isMissingNotificationTarget(error)) throw error;
    return run(false);
  }
};
