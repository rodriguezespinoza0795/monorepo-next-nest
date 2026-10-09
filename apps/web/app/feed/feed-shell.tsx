"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import TagIcon from "@mui/icons-material/Tag";
import type { Member } from "@repo/community/members";
import { FeedLayout } from "@repo/ui/feed/feed-layout";
import { NewMembersCard } from "@repo/ui/feed/member-card";
import { SpaceNav } from "@repo/ui/feed/space-nav";
import { profileHref } from "../../lib/routes";
import { SPACES } from "../../lib/spaces";

interface FeedShellProps {
  user: { id: string; name: string; image?: string | null };
  /** Últimos miembros en unirse (barra lateral). */
  newMembers: Member[];
  children: ReactNode;
}

const mainItems = [
  {
    label: "Inicio",
    href: "/feed",
    icon: <HomeOutlinedIcon fontSize="small" />,
  },
  {
    label: "Miembros",
    href: "/feed/members",
    icon: <GroupsOutlinedIcon fontSize="small" />,
  },
  {
    label: "Guardados",
    href: "/feed/saved",
    icon: <BookmarkBorderIcon fontSize="small" />,
  },
];

const spaceItems = SPACES.map((space) => ({
  label: space.name,
  href: `/feed/${space.id}`,
  icon: <TagIcon fontSize="small" />,
}));

// Acceso a tu perfil desde el menú lateral (cerrar sesión está en el menú
// de la cuenta, en el encabezado).
const UserBox = ({ user }: Pick<FeedShellProps, "user">) => (
  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", px: 1 }}>
    <Avatar
      src={user.image ?? undefined}
      alt={user.name}
      sx={{ width: 32, height: 32 }}
    >
      {user.name.charAt(0)}
    </Avatar>
    <MuiLink
      component={Link}
      href={profileHref(user.id) ?? "/feed"}
      noWrap
      color="inherit"
      underline="hover"
      aria-label="Mi perfil"
      sx={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500 }}
    >
      {user.name}
    </MuiLink>
  </Stack>
);

const CommunityAside = ({ newMembers }: Pick<FeedShellProps, "newMembers">) => (
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
    <NewMembersCard
      members={newMembers.map((member) => ({
        name: member.name,
        image: member.image,
        joinedAt: new Date(member.joinedAt),
      }))}
      href="/feed/members"
      linkComponent={Link}
    />
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

export const FeedShell = ({ user, newMembers, children }: FeedShellProps) => {
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
    <FeedLayout nav={nav} aside={<CommunityAside newMembers={newMembers} />}>
      {children}
    </FeedLayout>
  );
};
