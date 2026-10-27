import "server-only";
import type { AuthUser } from "@repo/auth/session";
import { isAdmin } from "./admins";
import { streamUserId } from "./users";

export interface MemberUser {
  /** Id del miembro en Stream (`f_<uid>`). */
  streamId: string;
  email: string;
  name: string;
  image: string | null;
  /** Admin solo con el correo en `ADMIN_EMAILS` y verificado. */
  admin: boolean;
}

// El usuario de la app principal como miembro de la comunidad. Lo usan `web`
// y `admin`, así que los dos lo ven igual.
export const memberFromAuthUser = (user: AuthUser): MemberUser => {
  const email = user.email ?? "";
  return {
    streamId: streamUserId(user.uid),
    email,
    // Quien entra con enlace mágico no tiene nombre: se usa su correo.
    name: user.name || email.split("@")[0] || "Miembro",
    image: user.image,
    admin: user.emailVerified && isAdmin(email),
  };
};
