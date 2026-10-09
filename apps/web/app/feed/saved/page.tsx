import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { isUploadedImage } from "@repo/community/attachments";
import { BRAND } from "@repo/community/brand";
import { EmptyState } from "@repo/ui/feed/empty-state";
import { FeedHeader } from "@repo/ui/feed/feed-header";
import { auth } from "../../../lib/auth";
import { SPACES } from "../../../lib/spaces";
import { stream } from "../../../lib/stream";
import { SavedList, type SavedPost } from "./saved-list";

export const metadata: Metadata = { title: `Guardados · ${BRAND.name}` };

const PAGE_SIZE = 20;

const spaceNames = new Map(
  SPACES.map((space) => [`space:${space.id}`, space.name]),
);

// Guardados del miembro (bookmarks privados de Stream), del más reciente al
// más antiguo. Si una publicación se eliminó, su guardado ya no trae la
// actividad y se omite.
export default async function SavedPage({
  searchParams,
}: PageProps<"/feed/saved">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { next } = await searchParams;
  const { streamId } = session.user;
  const { bookmarks, next: nextPage } = await stream.feeds.queryBookmarks({
    filter: { user_id: streamId },
    sort: [{ field: "created_at", direction: -1 }],
    limit: PAGE_SIZE,
    next: typeof next === "string" ? next : undefined,
    user_id: streamId,
  });

  const posts: SavedPost[] = bookmarks.flatMap(({ activity }) =>
    activity && !activity.deleted_at && activity.type === "post"
      ? [
          {
            id: activity.id,
            text: activity.text ?? "",
            createdAt: new Date(activity.created_at).toISOString(),
            author: {
              name: activity.user.name ?? activity.user.id,
              image: activity.user.image,
            },
            space: activity.feeds
              .map((fid) => spaceNames.get(fid))
              .find((name) => name !== undefined),
            imageCount: activity.attachments.filter(isUploadedImage).length,
          },
        ]
      : [],
  );

  return (
    <Stack spacing={2.5}>
      <FeedHeader
        title="Guardados"
        description="Las publicaciones que guardaste para leer después. Solo tú las ves."
      />
      {posts.length > 0 ? (
        <SavedList posts={posts} />
      ) : (
        <EmptyState
          icon={<BookmarkBorderIcon fontSize="inherit" />}
          title={next ? "No hay más guardados" : "Aún no guardas nada"}
          description="Toca el marcador de una publicación para guardarla aquí."
        />
      )}
      {nextPage && (
        <Button
          variant="outlined"
          href={`/feed/saved?next=${encodeURIComponent(nextPage)}`}
          sx={{ alignSelf: "center" }}
        >
          Ver más
        </Button>
      )}
    </Stack>
  );
}
