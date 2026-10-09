"use client";

import { useRouter } from "next/navigation";
import LogoutIcon from "@mui/icons-material/Logout";
import { UserMenu } from "@repo/ui/user-menu";
import { authClient } from "../../lib/auth-client";

// Menú de la cuenta en el encabezado del panel (igual que en la comunidad).
export const AccountMenu = ({
  user,
}: {
  user: { name: string; email: string; image?: string | null };
}) => {
  const router = useRouter();

  return (
    <UserMenu
      name={user.name}
      image={user.image ?? undefined}
      detail={user.email}
      items={[
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
