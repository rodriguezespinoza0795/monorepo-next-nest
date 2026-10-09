import type { Metadata } from "next";
import { PostDetail } from "./post-detail";
import { BRAND } from "@repo/community/brand";

export const metadata: Metadata = { title: `Publicación · ${BRAND.name}` };

export default async function PostPage({
  params,
}: PageProps<"/feed/post/[id]">) {
  const { id } = await params;
  return <PostDetail activityId={id} />;
}
