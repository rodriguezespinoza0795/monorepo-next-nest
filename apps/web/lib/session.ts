import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@repo/auth/session";
import {
  memberFromAuthUser,
  type MemberUser,
} from "@repo/community/member-session";

export interface Session {
  user: MemberUser;
}

// Sesión del miembro: la cookie que crea la app principal al iniciar sesión.
// Una vez por petición (`cache`), aunque la pidan el layout y la página.
export const getSession = cache(async (): Promise<Session | null> => {
  const user = await verifySession(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  return user ? { user: memberFromAuthUser(user) } : null;
});
