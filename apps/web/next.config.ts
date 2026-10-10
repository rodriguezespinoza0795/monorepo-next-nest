import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Las pruebas de punta a punta compilan en su propia carpeta para no
  // chocar con el servidor de desarrollo (ver playwright.config.ts).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Sin `AGENTS.md` / `CLAUDE.md` generados por `next dev`: las reglas del
  // proyecto viven en el `CLAUDE.md` de la raíz.
  agentRules: false,
};

// Sube los source maps a Sentry en el build (solo si hay `SENTRY_AUTH_TOKEN`;
// organización y proyecto en `SENTRY_ORG` y `SENTRY_PROJECT`), para ver el
// código original en cada error. No se publican junto a la app.
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});
