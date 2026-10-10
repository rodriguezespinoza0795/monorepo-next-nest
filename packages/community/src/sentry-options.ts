// Opciones de Sentry comunes a `web` y `admin` (servidor, edge y navegador).
// Solo errores: sin trazas de rendimiento ni grabación de sesiones. Sin DSN
// (desarrollo, CI, pruebas E2E) queda apagado.

interface SentryEventLike {
  user?: { id?: string | number; [key: string]: unknown };
  request?: { cookies?: unknown; headers?: unknown; data?: unknown };
}

/**
 * Privacidad: además de `sendDefaultPii: false`, se quitan del evento los
 * datos personales que pudieran colarse. Del usuario solo queda el id
 * interno (`g_…`), para contar a cuántas personas afecta un error.
 */
export const scrubEvent = <T extends SentryEventLike>(event: T): T => {
  if (event.user) {
    event.user =
      event.user.id === undefined ? undefined : { id: event.user.id };
  }
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
  }
  return event;
};

export const sentryOptions = (dsn: string | undefined) => ({
  dsn,
  enabled: Boolean(dsn),
  environment:
    process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  sendDefaultPii: false,
  beforeSend: scrubEvent,
});
