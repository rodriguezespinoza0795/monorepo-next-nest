import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@repo/ui/site-header";
import { auth } from "../../lib/auth";
import { FeedShell } from "./feed-shell";
import { FeedsProvider } from "./feeds-provider";

export default async function FeedLayout({ children }: LayoutProps<"/feed">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { streamId, name, image } = session.user;
  const user = { id: streamId, name, image };

  return (
    <>
      <SiteHeader brand="getStream" action={{ label: "Inicio", href: "/" }} />
      <FeedShell user={user}>
        <FeedsProvider user={user}>{children}</FeedsProvider>
      </FeedShell>
    </>
  );
}
