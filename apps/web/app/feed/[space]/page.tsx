import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "../../../lib/admins";
import { auth } from "../../../lib/auth";
import { canPostIn, findSpace } from "../../../lib/spaces";
import { FeedHeader } from "@repo/ui/feed/feed-header";
import { ActivityFeed } from "../activity-feed";
import { SpaceMembershipButton } from "../space-membership-button";
import { BRAND } from "@repo/community/brand";

export async function generateMetadata({
  params,
}: PageProps<"/feed/[space]">): Promise<Metadata> {
  const space = findSpace((await params).space);
  return { title: `${space?.name ?? "Espacio"} · ${BRAND.name}` };
}

export default async function SpacePage({
  params,
}: PageProps<"/feed/[space]">) {
  const space = findSpace((await params).space);
  if (!space) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const admin = isAdmin(session.user.email);
  const canPost = canPostIn(space, admin);

  return (
    <ActivityFeed
      groupId="space"
      feedId={space.id}
      header={
        <FeedHeader
          title={space.name}
          description={space.description}
          action={<SpaceMembershipButton spaceId={space.id} />}
        />
      }
      empty={{
        title: "Todavía no hay publicaciones",
        description: "Cuando alguien publique en este espacio, lo verás aquí.",
      }}
      postableSpaces={canPost ? [{ id: space.id, name: space.name }] : []}
      canPin={admin}
    />
  );
}
