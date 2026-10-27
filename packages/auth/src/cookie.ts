// Cookie de sesión que crea la app principal. Sin dependencias de servidor,
// para poder leerla también desde `proxy.ts`.

/** Nombre de la cookie de sesión. */
export const SESSION_COOKIE =
  process.env.SESSION_COOKIE_NAME || "davidre_session";

/** Opciones para borrar la cookie: mismo dominio y ruta con que se creó. */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  domain: process.env.SESSION_COOKIE_DOMAIN || undefined,
};
