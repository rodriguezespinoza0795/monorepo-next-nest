import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@repo/community/sentry-options";

// Sentry en el navegador: solo errores (sin trazas ni grabación de sesiones).
Sentry.init(sentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN));

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
