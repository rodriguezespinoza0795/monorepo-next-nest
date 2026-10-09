import type { Metadata } from "next";
import Container from "@mui/material/Container";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { EmptyState } from "@repo/ui/feed/empty-state";
import { SiteHeader } from "@repo/ui/site-header";
import { getAdminSession } from "../../lib/session";
import { AccountMenu } from "./account-menu";
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
        extra={<AccountMenu user={user} />}
      />
      <Container maxWidth="md" sx={{ pt: { xs: 10, sm: 12 }, pb: 8 }}>
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
