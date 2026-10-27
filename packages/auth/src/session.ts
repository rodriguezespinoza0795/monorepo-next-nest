import "server-only";
import { firebaseAdapter } from "./firebase";
import type { AuthAdapter } from "./types";

export type { AuthUser } from "./types";
export { SESSION_COOKIE, sessionCookieOptions } from "./cookie";

// Proveedor de login de la app principal. Hoy solo Firebase; otro proveedor
// se agrega como un adaptador nuevo (ver `types.ts`).
const adapter: AuthAdapter = firebaseAdapter;

/** Usuario de la cookie de sesión, o `null` si falta o no es válida. */
export const verifySession = async (cookieValue: string | undefined) =>
  cookieValue ? adapter.verifySession(cookieValue) : null;

/**
 * Login de la app principal, que al terminar vuelve a `returnTo` (URL
 * absoluta; la app principal solo acepta hosts permitidos).
 */
export const loginUrl = (returnTo: string) => {
  const url = new URL(
    process.env.AUTH_LOGIN_URL || "http://localhost:3002/login",
  );
  url.searchParams.set("next", returnTo);
  return url.toString();
};
