import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import { stream } from "@repo/community/stream";
import { EmptyState } from "@repo/ui/feed/empty-state";
import { FeedHeader } from "@repo/ui/feed/feed-header";
import {
  bannableAuthor,
  getSpaceNames,
  toPostCard,
} from "../../lib/community-data";
import { getAdminSession } from "../../lib/session";
import { ModerationButtons } from "./moderation-buttons";
import { PostCardLink } from "./post-card-link";

const PAGE_SIZE = 20;

export default async function ModerationPage({
  searchParams,
}: PageProps<"/moderacion">) {
  const { user } = await getAdminSession();
  const { next } = await searchParams;
  const [{ activities, next: nextPage }, spaceNames] = await Promise.all([
    stream.feeds.queryActivities({
      filter: { activity_type: "post" },
      sort: [{ field: "created_at", direction: -1 }],
      limit: PAGE_SIZE,
      next: typeof next === "string" ? next : undefined,
    }),
    getSpaceNames(),
  ]);

  return (
    <Stack spacing={3}>
      <FeedHeader
        title="Publicaciones"
        description="Lo más reciente de todos los espacios. Elimina contenido o bloquea a quien no respete las normas."
      />
      {activities.length === 0 && (
        <EmptyState
          icon={<ForumOutlinedIcon fontSize="inherit" />}
          title="No hay publicaciones"
        />
      )}
      {activities.map((activity) => (
        <Stack key={activity.id} spacing={1}>
          <PostCardLink
            {...toPostCard(activity, spaceNames)}
            href={`/moderacion/post/${activity.id}`}
          />
          <ModerationButtons
            target="post"
            id={activity.id}
            author={bannableAuthor(activity.user, user.streamId)}
          />
        </Stack>
      ))}
      {nextPage && (
        <Button
          variant="outlined"
          href={`/moderacion?next=${encodeURIComponent(nextPage)}`}
          sx={{ alignSelf: "center" }}
        >
          Ver anteriores
        </Button>
      )}
    </Stack>
  );
}
