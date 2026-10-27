"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionCookieOptions } from "@repo/auth/cookie";

// Cierra la sesión: borra la cookie compartida, así que también se cierra en
// la app principal y en la comunidad.
export async function signOut() {
  (await cookies()).set(SESSION_COOKIE, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
  redirect("/");
}
