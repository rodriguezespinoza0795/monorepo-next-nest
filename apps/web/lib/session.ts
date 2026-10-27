import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { loginUrl, SESSION_COOKIE, verifySession } from "@repo/auth/session";
import { isAdmin } from "@repo/community/admins";
import { streamUserId } from "@repo/community/users";

export interface Session {
  user: {
    /** Id del miembro en Stream (`f_<uid>`). */
    streamId: string;
    email: string;
    name: string;
    image: string | null;
    /** Admin solo con el correo en la lista y verificado. */
    admin: boolean;
  };
}

// Sesión del miembro: la cookie que crea la app principal al iniciar sesión.
// Una vez por petición (`cache`), aunque la pidan el layout y la página.
export const getSession = cache(async (): Promise<Session | null> => {
  const user = await verifySession(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!user) return null;
  const email = user.email ?? "";
  return {
    user: {
      streamId: streamUserId(user.uid),
      email,
      // Quien entra con enlace mágico no tiene nombre: se usa su correo.
      name: user.name || email.split("@")[0] || "Miembro",
      image: user.image,
      admin: user.emailVerified && isAdmin(email),
    },
  };
});

const APP_URL = process.env.APP_URL || "http://localhost:3000";

/** Ruta de la comunidad a la que volver tras el login (o `/feed`). */
export const safeReturnPath = (next: unknown) =>
  typeof next === "string" &&
  next.startsWith("/") &&
  !next.startsWith("//") &&
  !next.startsWith("/\\")
    ? next
    : "/feed";

/** Login de la app principal, que al terminar vuelve a `path`. */
export const communityLoginUrl = (path: string) =>
  loginUrl(new URL(path, APP_URL).toString());
