import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@repo/auth/session";
import { memberFromAuthUser } from "@repo/community/member-session";

// Sesión compartida con la app principal y la comunidad (misma cookie), o
// `null`. Una vez por petición, aunque la pidan el layout y la página.
export const getSession = cache(async () => {
  const user = await verifySession(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  return user ? { user: memberFromAuthUser(user) } : null;
});

// Sesión de quien entra al panel. Sin sesión redirige a /login; con sesión
// pero sin permisos (correo fuera de `ADMIN_EMAILS` o sin verificar) devuelve
// `admin: false` para mostrar "Sin acceso".
export const getAdminSession = async () => {
  const session = await getSession();
  if (!session) redirect("/login");
  return { ...session, admin: session.user.admin };
};

// Para server actions: lanza si quien llama no es administrador.
export const requireAdmin = async () => {
  const session = await getSession();
  if (!session?.user.admin) throw new Error("No autorizado");
  return session;
};
