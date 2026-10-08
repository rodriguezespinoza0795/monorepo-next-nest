"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import TagIcon from "@mui/icons-material/Tag";
import { FeedLayout } from "@repo/ui/feed/feed-layout";
import { SpaceNav } from "@repo/ui/feed/space-nav";
import { authClient } from "../../lib/auth-client";
import { SPACES } from "../../lib/spaces";

interface FeedShellProps {
  user: { name: string; image?: string | null };
  children: ReactNode;
}

const mainItems = [
  {
    label: "Inicio",
    href: "/feed",
    icon: <HomeOutlinedIcon fontSize="small" />,
  },
];

const spaceItems = SPACES.map((space) => ({
  label: space.name,
  href: `/feed/${space.id}`,
  icon: <TagIcon fontSize="small" />,
}));

const UserBox = ({ user }: Pick<FeedShellProps, "user">) => {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", px: 1 }}>
      <Avatar
        src={user.image ?? undefined}
        alt={user.name}
        sx={{ width: 32, height: 32 }}
      >
        {user.name.charAt(0)}
      </Avatar>
      <Typography
        noWrap
        sx={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500 }}
      >
        {user.name}
      </Typography>
      <Button
        size="small"
        onClick={signOut}
        disabled={signingOut}
        sx={{ flexShrink: 0 }}
      >
        Salir
      </Button>
    </Stack>
  );
};

const CommunityAside = () => (
  <Stack spacing={2}>
    <Card sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom>
        Sobre la comunidad
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Un lugar para compartir avances, hacer preguntas y conocer a otras
        personas del proyecto.
      </Typography>
    </Card>
    <Card sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom>
        Próximos eventos
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Muy pronto anunciaremos los primeros encuentros.
      </Typography>
    </Card>
  </Stack>
);

export const FeedShell = ({ user, children }: FeedShellProps) => {
  const pathname = usePathname();

  const nav = (
    <Stack spacing={1}>
      <SpaceNav items={mainItems} activeHref={pathname} linkComponent={Link} />
      <SpaceNav
        title="Espacios"
        items={spaceItems}
        activeHref={pathname}
        linkComponent={Link}
      />
      <Divider />
      <Box sx={{ pt: 1 }}>
        <UserBox user={user} />
      </Box>
    </Stack>
  );

  return (
    <FeedLayout nav={nav} aside={<CommunityAside />}>
      {children}
    </FeedLayout>
  );
};
