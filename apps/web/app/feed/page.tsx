import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "../../lib/admins";
import { auth } from "../../lib/auth";
import { canPostIn, SPACES } from "../../lib/spaces";
import { FeedHeader } from "@repo/ui/feed/feed-header";
import { ActivityFeed } from "./activity-feed";
import { BRAND } from "@repo/community/brand";

export const metadata: Metadata = { title: `Comunidad · ${BRAND.name}` };

export default async function FeedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const admin = isAdmin(session.user.email);
  const postableSpaces = SPACES.filter((space) => canPostIn(space, admin)).map(
    ({ id, name }) => ({ id, name }),
  );

  return (
    <ActivityFeed
      groupId="timeline"
      feedId={session.user.streamId}
      header={
        <FeedHeader
          title="Inicio"
          description="Lo más reciente de los espacios que sigues."
        />
      }
      empty={{
        title: "Tu Inicio está vacío",
        description:
          "Únete a un espacio desde el menú de Espacios para ver aquí sus publicaciones.",
      }}
      postableSpaces={postableSpaces}
    />
  );
}
