"use client";

import LogoutIcon from "@mui/icons-material/Logout";
import { UserMenu } from "@repo/ui/user-menu";
import { signOut } from "./actions";

interface AccountMenuProps {
  name: string;
  email: string | null;
  image: string | null;
}

export const AccountMenu = ({ name, email, image }: AccountMenuProps) => (
  <UserMenu
    name={name}
    image={image ?? undefined}
    detail={email ?? undefined}
    items={[
      {
        label: "Cerrar sesión",
        icon: <LogoutIcon fontSize="small" />,
        onClick: () => void signOut(),
      },
    ]}
  />
);
