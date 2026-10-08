import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import RestoreIcon from "@mui/icons-material/Restore";
import { EmptyState } from "@repo/ui/feed/empty-state";
import { FeedHeader } from "@repo/ui/feed/feed-header";
import { RelativeTime } from "@repo/ui/feed/relative-time";
import {
  getDeletedPosts,
  getSpaceNames,
  toPostCard,
} from "../../../lib/community-data";
import { getAdminSession } from "../../../lib/session";
import { DeletedPostButtons } from "../moderation-buttons";
import { PostCardLink } from "../post-card-link";

export default async function DeletedPostsPage() {
  await getAdminSession();
  const [posts, spaceNames] = await Promise.all([
    getDeletedPosts(),
    getSpaceNames(),
  ]);

  return (
    <Stack spacing={3}>
      <FeedHeader
        title="Eliminadas"
        description="Publicaciones eliminadas desde el panel. Puedes restaurarlas o borrarlas para siempre."
      />
      {posts.length === 0 && (
        <EmptyState
          icon={<RestoreIcon fontSize="inherit" />}
          title="No hay publicaciones eliminadas"
        />
      )}
      {posts.map((activity) => (
        <Stack key={activity.id} spacing={1}>
          {activity.deleted_at && (
            <Typography variant="body2" color="text.secondary">
              Eliminada <RelativeTime date={new Date(activity.deleted_at)} />
            </Typography>
          )}
          <PostCardLink {...toPostCard(activity, spaceNames)} />
          <DeletedPostButtons id={activity.id} />
        </Stack>
      ))}
    </Stack>
  );
}
