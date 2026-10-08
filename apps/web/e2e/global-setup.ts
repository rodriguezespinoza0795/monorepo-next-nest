import { execFileSync } from "node:child_process";

// Deja la app de Stream de pruebas lista (grupos, espacios, permisos y posts
// de bienvenida). Es idempotente y no gasta actividades si ya existe todo.
export default function globalSetup() {
  if (!process.env.STREAM_API_SECRET) {
    throw new Error(
      "Faltan las credenciales de la app de Stream de pruebas (.env.test.local)",
    );
  }
  execFileSync(process.execPath, ["scripts/stream-setup.ts"], {
    stdio: "inherit",
    env: process.env,
  });
}
