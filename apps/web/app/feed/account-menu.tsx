"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import { UserMenu } from "@repo/ui/user-menu";
import { authClient } from "../../lib/auth-client";
import { profileHref } from "../../lib/routes";

// Menú de la cuenta en el encabezado: perfil y cerrar sesión (visible
// también en móvil, donde antes "Salir" quedaba dentro del menú de Espacios).
export const AccountMenu = ({
  user,
}: {
  user: { id: string; name: string; email: string; image?: string | null };
}) => {
  const router = useRouter();

  return (
    <UserMenu
      name={user.name}
      image={user.image ?? undefined}
      detail={user.email}
      linkComponent={Link}
      items={[
        {
          label: "Mi perfil",
          icon: <PersonOutlineIcon fontSize="small" />,
          href: profileHref(user.id),
        },
        {
          label: "Cerrar sesión",
          icon: <LogoutIcon fontSize="small" />,
          onClick: async () => {
            await authClient.signOut();
            router.push("/login");
          },
        },
      ]}
    />
  );
};
