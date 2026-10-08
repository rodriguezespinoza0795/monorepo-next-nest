import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../../lib/auth";
import { ActivityFeed } from "./activity-feed";

export const metadata: Metadata = { title: "Comunidad · getStream" };

export default async function FeedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <ActivityFeed
      groupId="timeline"
      feedId={session.user.streamId}
      title="Inicio"
      description="Lo más reciente de los espacios que sigues."
    />
  );
}
