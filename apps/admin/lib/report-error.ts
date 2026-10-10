import * as Sentry from "@sentry/nextjs";

// Errores que la app captura para seguir funcionando (y que Sentry no vería
// por sí solo): se escriben en la consola y se envían a Sentry.
export const reportError = (message: string, error: unknown) => {
  console.error(message, error);
  Sentry.captureException(error, { extra: { message } });
};

/** Situaciones degradadas pero esperadas (por ejemplo, Upstash lento). */
export const reportWarning = (
  message: string,
  extra?: Record<string, unknown>,
) => {
  console.warn(message, extra ?? "");
  Sentry.captureMessage(message, { level: "warning", extra });
};
