import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "../../../lib/admins";
import { auth } from "../../../lib/auth";
import { canPostIn, findSpace } from "../../../lib/spaces";
import { ActivityFeed } from "../activity-feed";

export async function generateMetadata({
  params,
}: PageProps<"/feed/[space]">): Promise<Metadata> {
  const space = findSpace((await params).space);
  return { title: `${space?.name ?? "Espacio"} · getStream` };
}

export default async function SpacePage({
  params,
}: PageProps<"/feed/[space]">) {
  const space = findSpace((await params).space);
  if (!space) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const canPost = canPostIn(space, isAdmin(session.user.email));

  return (
    <ActivityFeed
      groupId="space"
      feedId={space.id}
      title={space.name}
      description={space.description}
      postableSpaces={canPost ? [{ id: space.id, name: space.name }] : []}
    />
  );
}
