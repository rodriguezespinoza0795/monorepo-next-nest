import type { Metadata } from "next";
import { PostDetail } from "./post-detail";

export const metadata: Metadata = { title: "Publicación · getStream" };

export default async function PostPage({
  params,
}: PageProps<"/feed/post/[id]">) {
  const { id } = await params;
  return <PostDetail activityId={id} />;
}
