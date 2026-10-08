import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { CommentResponse } from "@stream-io/node-sdk";
import { stream } from "@repo/community/stream";
import { CommentItem } from "@repo/ui/feed/comment-item";
import { EmptyState } from "@repo/ui/feed/empty-state";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import {
  bannableAuthor,
  getSpaceNames,
  toPostCard,
} from "../../../../lib/community-data";
import { getAdminSession } from "../../../../lib/session";
import { ModerationButtons } from "../../moderation-buttons";
import { PostCardLink } from "../../post-card-link";

const findPost = (id: string) =>
  stream.feeds
    .getActivity({ id })
    .then(({ activity }) => activity)
    .catch(() => undefined);

const flatten = (comments: CommentResponse[]): CommentResponse[] =>
  comments.flatMap((comment) => [
    comment,
    ...flatten((comment as { replies?: CommentResponse[] }).replies ?? []),
  ]);

export default async function ModeratedPostPage({
  params,
}: PageProps<"/moderacion/post/[id]">) {
  const { user } = await getAdminSession();
  const { id } = await params;
  const activity = await findPost(id);

  const back = (
    <Button
      href="/moderacion"
      startIcon={<ArrowBackIcon />}
      sx={{ alignSelf: "flex-start", color: "text.secondary" }}
    >
      Volver a publicaciones
    </Button>
  );

  if (!activity) {
    return (
      <Stack spacing={2}>
        {back}
        <EmptyState
          icon={<SearchOffIcon fontSize="inherit" />}
          title="No encontramos esta publicación"
          description="Puede que ya se haya eliminado."
        />
      </Stack>
    );
  }

  const [{ comments }, spaceNames] = await Promise.all([
    stream.feeds.getComments({
      object_id: id,
      object_type: "activity",
      depth: 2,
      limit: 50,
      sort: "first",
    }),
    getSpaceNames(),
  ]);
  const all = flatten(comments).filter(
    (comment) => comment.status !== "deleted",
  );

  return (
    <Stack spacing={2}>
      {back}
      <PostCardLink {...toPostCard(activity, spaceNames)} />
      <ModerationButtons
        target="post"
        id={activity.id}
        author={bannableAuthor(activity.user, user.streamId)}
      />
      <Card component="section" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2.5}>
          <Typography variant="h3" component="h2">
            Comentarios ({all.length})
          </Typography>
          {all.length === 0 && (
            <Typography color="text.secondary">
              Esta publicación no tiene comentarios.
            </Typography>
          )}
          {all.map((comment) => (
            <Stack key={comment.id} spacing={0.5}>
              <CommentItem
                author={{
                  name: comment.user.name ?? comment.user.id,
                  image: comment.user.image,
                }}
                createdAt={new Date(comment.created_at)}
                text={
                  comment.parent_id ? `↳ ${comment.text ?? ""}` : comment.text
                }
                mentions={comment.mentioned_users.map((mentioned) => ({
                  name: mentioned.name ?? mentioned.id,
                }))}
              />
              <Stack sx={{ pl: 5.5 }}>
                <ModerationButtons
                  target="comment"
                  id={comment.id}
                  author={bannableAuthor(comment.user, user.streamId)}
                />
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
