import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findSpace } from "../../../lib/spaces";
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

  return (
    <ActivityFeed
      groupId="space"
      feedId={space.id}
      title={space.name}
      description={space.description}
    />
  );
}
