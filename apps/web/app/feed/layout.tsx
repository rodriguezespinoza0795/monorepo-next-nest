import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@repo/ui/site-header";
import { auth } from "../../lib/auth";
import { FeedShell } from "./feed-shell";
import { FeedsProvider } from "./feeds-provider";
import { NotificationsMenu } from "./notifications-menu";

export default async function FeedLayout({ children }: LayoutProps<"/feed">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { streamId, name, image } = session.user;
  const user = { id: streamId, name, image };

  return (
    <FeedsProvider user={user}>
      <SiteHeader
        brand="getStream"
        action={{ label: "Inicio", href: "/" }}
        extra={<NotificationsMenu />}
      />
      <FeedShell user={user}>{children}</FeedShell>
    </FeedsProvider>
  );
}
