import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Variables: las del entorno (CI) mandan; luego `.env.test.local` (app de
// Stream y proyecto de Firebase de pruebas) y por último `.env.local` para lo
// que falte (Upstash).
// `loadEnvFile` no sobrescribe lo que ya existe.
for (const file of [".env.test.local", ".env.local"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

export const E2E_PORT = 3100;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
export const E2E_ADMIN_EMAIL = "e2e-admin@example.test";
// Login de la app principal (no corre en las pruebas: solo se comprueba que
// la comunidad redirige allá).
export const E2E_LOGIN_URL = "http://localhost:3002/login";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Pocas a la vez: todas comparten un solo servidor y la app de Stream.
  workers: process.env.CI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["github"], ["html"]] : "list",
  use: {
    baseURL: E2E_BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Build propio en `.next-e2e` y puerto 3100: no choca con `pnpm dev`.
  webServer: {
    command: `pnpm exec next build && pnpm exec next start --port ${E2E_PORT}`,
    url: `${E2E_BASE_URL}/privacy`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      ...(process.env as Record<string, string>),
      NEXT_DIST_DIR: ".next-e2e",
      APP_URL: E2E_BASE_URL,
      AUTH_LOGIN_URL: E2E_LOGIN_URL,
      SESSION_COOKIE_DOMAIN: "",
      ADMIN_EMAILS: E2E_ADMIN_EMAIL,
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
