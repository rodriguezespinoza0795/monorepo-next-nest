import { redirect } from "next/navigation";
import { SiteHeader } from "@repo/ui/site-header";
import { getSession } from "../../lib/session";
import { getStreamUser } from "../../lib/membership";
import { onboardStreamUser } from "../../lib/onboarding";
import { reportError } from "../../lib/report-error";
import { FeedShell } from "./feed-shell";
import { FeedsProvider } from "./feeds-provider";
import { AccountMenu } from "./account-menu";
import { NotificationsMenu } from "./notifications-menu";
import { SearchButton } from "./search-button";
import { SuspendedNotice } from "./suspended-notice";
import { BRAND } from "@repo/community/brand";
import { listMembers } from "@repo/community/members";

export default async function FeedLayout({ children }: LayoutProps<"/feed">) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { streamId, name, image } = session.user;
  const user = { id: streamId, name, image };

  const streamUser = await getStreamUser(streamId);
  // Primera visita: se crea el miembro en Stream (perfil, feeds y espacios).
  // Si Stream falla no se bloquea la entrada; se reintenta en la próxima.
  if (!streamUser) {
    await onboardStreamUser(user).catch((error: unknown) =>
      reportError("[stream] onboarding falló", error),
    );
  }

  if (streamUser?.banned) {
    return (
      <>
        <SiteHeader
          brand={BRAND.name}
          action={{ label: "Inicio", href: "/" }}
        />
        <SuspendedNotice />
      </>
    );
  }

  // "Nuevos miembros" de la barra lateral. Si Stream falla, la tarjeta solo
  // muestra el enlace al directorio.
  const newMembers = await listMembers({ limit: 5 })
    .then(({ members }) => members)
    .catch(() => []);

  return (
    <FeedsProvider user={user}>
      <SiteHeader
        brand={BRAND.name}
        extra={
          <>
            <SearchButton />
            <NotificationsMenu />
            <AccountMenu user={{ ...user, email: session.user.email }} />
          </>
        }
      />
      <FeedShell user={user} newMembers={newMembers}>
        {children}
      </FeedShell>
    </FeedsProvider>
  );
}
