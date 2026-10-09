import type { Metadata } from "next";
import Avatar from "@mui/material/Avatar";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { EmptyState } from "@repo/ui/feed/empty-state";
import { SiteHeader } from "@repo/ui/site-header";
import { getAdminSession } from "../../lib/session";
import { SignOutButton } from "./sign-out-button";
import { ADMIN_BRAND } from "@repo/community/brand";

export const metadata: Metadata = { title: `Moderación · ${ADMIN_BRAND}` };

export default async function ModerationLayout({
  children,
}: LayoutProps<"/moderacion">) {
  const { user, admin } = await getAdminSession();

  return (
    <>
      <SiteHeader
        brand={ADMIN_BRAND}
        links={
          admin
            ? [
                { label: "Publicaciones", href: "/moderacion" },
                { label: "Eliminadas", href: "/moderacion/eliminadas" },
                { label: "Bloqueados", href: "/moderacion/bloqueados" },
              ]
            : []
        }
        action={{ label: "Inicio", href: "/" }}
      />
      <Container maxWidth="md" sx={{ pt: { xs: 10, sm: 12 }, pb: 8 }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", justifyContent: "flex-end", mb: 3 }}
        >
          <Avatar
            src={user.image ?? undefined}
            alt={user.name}
            sx={{ width: 28, height: 28 }}
          >
            {user.name.charAt(0)}
          </Avatar>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user.email}
          </Typography>
          <SignOutButton />
        </Stack>
        {admin ? (
          children
        ) : (
          <EmptyState
            icon={<LockOutlinedIcon fontSize="inherit" />}
            title="No tienes acceso al panel"
            description="Solo el equipo de la comunidad puede moderar. Si crees que es un error, pide que agreguen tu correo a la lista de administradores."
          />
        )}
      </Container>
    </>
  );
}
