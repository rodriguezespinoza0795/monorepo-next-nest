import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ProfileHeader } from "@repo/ui/feed/profile-header";
import { auth } from "../../../../lib/auth";
import { SYSTEM_USER_ID } from "../../../../lib/feeds";
import { getOrCreateOwnedFeed } from "../../../../lib/owned-feed";
import { stream } from "../../../../lib/stream";
import { ActivityFeed } from "../../activity-feed";

const STREAM_ID = /^[A-Za-z0-9_-]{1,64}$/;

const findMember = async (id: string) => {
  if (!STREAM_ID.test(id) || id === SYSTEM_USER_ID) return undefined;
  const { users } = await stream.queryUsers({
    payload: { filter_conditions: { id: { $eq: id } }, limit: 1 },
  });
  return users[0];
};

export async function generateMetadata({
  params,
}: PageProps<"/feed/u/[id]">): Promise<Metadata> {
  const member = await findMember(decodeURIComponent((await params).id));
  return { title: `${member?.name ?? "Perfil"} · getStream` };
}

export default async function ProfilePage({
  params,
}: PageProps<"/feed/u/[id]">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const id = decodeURIComponent((await params).id);
  const member = await findMember(id);
  if (!member) notFound();

  // El feed de perfil debe existir con `system` como dueño antes de que el
  // navegador lo pida: si lo creara el visitante, quedaría como dueño y
  // podría publicar en el perfil ajeno.
  await getOrCreateOwnedFeed(stream, {
    group: "profile",
    id: member.id,
    ownerId: SYSTEM_USER_ID,
    authorId: member.id,
  });

  const name = member.name ?? member.id;
  const isMe = member.id === session.user.streamId;

  return (
    <ActivityFeed
      groupId="profile"
      feedId={member.id}
      header={
        <ProfileHeader
          name={name}
          image={member.image}
          memberSince={new Date(member.created_at)}
          isMe={isMe}
        />
      }
      empty={{
        title: isMe ? "Aún no publicas nada" : "Aún no hay publicaciones",
        description: isMe
          ? "Tus publicaciones en los espacios aparecerán aquí."
          : `Cuando ${name} publique en un espacio, lo verás aquí.`,
      }}
    />
  );
}
