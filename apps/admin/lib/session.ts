import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@repo/community/admins";
import { auth } from "./auth";

// Sesión de un administrador. Sin sesión redirige a /login; con sesión pero
// sin permisos devuelve `admin: false` para mostrar "Sin acceso".
export const getAdminSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return { ...session, admin: isAdmin(session.user.email) };
};

// Para server actions: lanza si quien llama no es administrador.
export const requireAdmin = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdmin(session.user.email)) {
    throw new Error("No autorizado");
  }
  return session;
};
