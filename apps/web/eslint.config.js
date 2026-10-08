import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  // Salidas de las pruebas de punta a punta (Playwright).
  { ignores: [".next-e2e/**", "test-results/**", "playwright-report/**"] },
];
