import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@repo/ui/site-header";
import { auth } from "../../lib/auth";
import { isBanned } from "../../lib/membership";
import { FeedShell } from "./feed-shell";
import { FeedsProvider } from "./feeds-provider";
import { AccountMenu } from "./account-menu";
import { NotificationsMenu } from "./notifications-menu";
import { SearchButton } from "./search-button";
import { SuspendedNotice } from "./suspended-notice";
import { BRAND } from "@repo/community/brand";

export default async function FeedLayout({ children }: LayoutProps<"/feed">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { streamId, name, image } = session.user;
  const user = { id: streamId, name, image };

  if (await isBanned(streamId)) {
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
      <FeedShell user={user}>{children}</FeedShell>
    </FeedsProvider>
  );
}
