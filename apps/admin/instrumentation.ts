import * as Sentry from "@sentry/nextjs";

// Sentry en el servidor (Node y edge). Ver `sentry.*.config.ts`.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Errores no capturados en páginas, rutas y server actions.
export const onRequestError = Sentry.captureRequestError;
