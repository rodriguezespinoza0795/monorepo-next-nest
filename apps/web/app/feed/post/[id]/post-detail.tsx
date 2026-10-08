"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  useActivityComments,
  useClientConnectedUser,
  useFeedsClient,
  useStateStore,
  type ActivityWithStateUpdates,
  type CommentResponse,
} from "@stream-io/feeds-react-sdk";
import { CommentComposer } from "@repo/ui/feed/comment-composer";
import { CommentItem } from "@repo/ui/feed/comment-item";
import { PostCardSkeleton } from "@repo/ui/feed/post-card-skeleton";
import { profileHref } from "../../../../lib/routes";
import { ActivityPostCard } from "../../activity-post-card";
import { RequireFeedsClient } from "../../require-feeds-client";
import { useMentions } from "../../use-mentions";

const COMMENTS_PAGE_SIZE = 20;
const MAX_COMMENT_LENGTH = 2000;

type Author = { name: string; image?: string; href?: string };

const BackToFeed = () => (
  <Button
    component={Link}
    href="/feed"
    startIcon={<ArrowBackIcon />}
    sx={{ alignSelf: "flex-start", color: "text.secondary" }}
  >
    Volver al feed
  </Button>
);

const mentionsOf = (comment: CommentResponse) =>
  comment.mentioned_users.map((user) => ({
    name: user.name ?? user.id,
    href: profileHref(user.id),
  }));

const authorOf = (comment: CommentResponse): Author => ({
  name: comment.user.name ?? comment.user.id,
  image: comment.user.image,
  href: profileHref(comment.user.id),
});

// Composer de comentario o respuesta conectado a Stream.
const ConnectedCommentComposer = ({
  activityId,
  parentId,
  onDone,
  autoFocus,
}: {
  activityId: string;
  parentId?: string;
  onDone?: () => void;
  autoFocus?: boolean;
}) => {
  const client = useFeedsClient();
  const user = useClientConnectedUser();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const mentions = useMentions();

  if (!client || !user) return null;

  const submit = async () => {
    setSubmitting(true);
    setError(false);
    try {
      await client.addComment({
        object_id: activityId,
        object_type: "activity",
        comment: text.trim(),
        ...(parentId && { parent_id: parentId }),
        mentioned_user_ids: mentions.mentionedIds(text),
        // Avisa al autor del post (o del comentario, si es respuesta) y a
        // los mencionados.
        create_notification_activity: true,
      });
      setText("");
      mentions.reset();
      onDone?.();
    } catch (commentError) {
      console.error("[stream] no se pudo comentar", commentError);
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={1}>
      <CommentComposer
        user={{ name: user.name ?? user.id, image: user.image }}
        value={text}
        onChange={setText}
        onSubmit={submit}
        onCancel={parentId ? onDone : undefined}
        placeholder={parentId ? "Escribe una respuesta…" : undefined}
        submitLabel={parentId ? "Responder" : "Comentar"}
        submitting={submitting}
        autoFocus={autoFocus}
        maxLength={MAX_COMMENT_LENGTH}
        mentionSuggestions={mentions.suggestions}
        onMentionQuery={mentions.onMentionQuery}
        onMention={mentions.onMention}
      />
      {error && (
        <Alert severity="error">
          No pudimos enviar tu comentario. Inténtalo de nuevo.
        </Alert>
      )}
    </Stack>
  );
};

// Comentario de primer nivel con sus respuestas (un solo nivel de hilo:
// responder a una respuesta cuelga del mismo comentario raíz).
const CommentThread = ({
  activity,
  comment,
}: {
  activity: ActivityWithStateUpdates;
  comment: CommentResponse;
}) => {
  const [replying, setReplying] = useState(false);
  const {
    comments: replies = [],
    has_next_page,
    is_loading_next_page,
    loadNextPage,
  } = useActivityComments({ activity, parentComment: comment });
  const hidden = comment.reply_count - replies.length;

  return (
    <CommentItem
      linkComponent={Link}
      author={authorOf(comment)}
      createdAt={new Date(comment.created_at)}
      text={comment.text}
      mentions={mentionsOf(comment)}
      deleted={comment.status === "deleted"}
      onReply={() => setReplying(true)}
    >
      {replies.length > 0 &&
        replies.map((reply) => (
          <CommentItem
            linkComponent={Link}
            key={reply.id}
            author={authorOf(reply)}
            createdAt={new Date(reply.created_at)}
            text={reply.text}
            mentions={mentionsOf(reply)}
            deleted={reply.status === "deleted"}
            onReply={() => setReplying(true)}
          />
        ))}
      {hidden > 0 && (has_next_page || replies.length === 0) && (
        <Button
          size="small"
          onClick={() => void loadNextPage({ limit: COMMENTS_PAGE_SIZE })}
          disabled={is_loading_next_page}
          sx={{ alignSelf: "flex-start", color: "primary.light" }}
        >
          Ver {hidden} {hidden === 1 ? "respuesta" : "respuestas"}
        </Button>
      )}
      {replying && (
        <ConnectedCommentComposer
          activityId={activity.id}
          parentId={comment.id}
          onDone={() => setReplying(false)}
          autoFocus
        />
      )}
    </CommentItem>
  );
};

const Comments = ({ activity }: { activity: ActivityWithStateUpdates }) => {
  const {
    comments = [],
    has_next_page,
    is_loading_next_page,
    loadNextPage,
  } = useActivityComments({ activity });

  return (
    <Card
      component="section"
      aria-label="Comentarios"
      sx={{ p: { xs: 2.5, sm: 3 } }}
    >
      <Stack spacing={2.5}>
        <Typography variant="h3" component="h2">
          Comentarios
        </Typography>
        <ConnectedCommentComposer activityId={activity.id} />
        {comments.length === 0 ? (
          <Typography color="text.secondary">
            Sé la primera persona en comentar.
          </Typography>
        ) : (
          comments.map((comment) => (
            <CommentThread
              key={comment.id}
              activity={activity}
              comment={comment}
            />
          ))
        )}
        {has_next_page && (
          <Button
            variant="outlined"
            onClick={() => void loadNextPage({ limit: COMMENTS_PAGE_SIZE })}
            disabled={is_loading_next_page}
            sx={{ alignSelf: "center" }}
          >
            Ver más comentarios
          </Button>
        )}
      </Stack>
    </Card>
  );
};

const ConnectedPostDetail = ({ activityId }: { activityId: string }) => {
  const client = useFeedsClient();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  // La instancia se crea dentro del efecto (no con useMemo): `dispose()` la
  // desconecta del cliente y, en Strict Mode, reutilizarla tras la limpieza
  // dejaría de recibir los comentarios y reacciones nuevos.
  const [activityWithState, setActivityWithState] =
    useState<ActivityWithStateUpdates>();
  const { activity } =
    useStateStore(activityWithState?.state, (state) => ({
      activity: state.activity,
    })) ?? {};

  useEffect(() => {
    if (!client) return;
    const instance = client.activityWithStateUpdates(activityId);
    let cancelled = false;
    setActivityWithState(instance);
    setStatus("loading");
    instance
      .get({
        comments: {
          limit: COMMENTS_PAGE_SIZE,
          sort: "first",
          depth: 2,
          replies_limit: 3,
        },
      })
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((error: unknown) => {
        console.error("[stream] no se pudo cargar la publicación", error);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      instance.dispose();
    };
  }, [client, activityId]);

  return (
    <Stack spacing={2}>
      <BackToFeed />

      {status === "loading" && <PostCardSkeleton />}
      {status === "error" && (
        <Alert severity="error">
          No encontramos esta publicación. Puede que se haya eliminado.
        </Alert>
      )}
      {status === "ready" && activity && activityWithState && (
        <>
          <ActivityPostCard activity={activity} showSpace />
          <Comments activity={activityWithState} />
        </>
      )}
    </Stack>
  );
};

export const PostDetail = ({ activityId }: { activityId: string }) => (
  <RequireFeedsClient
    fallback={
      <Stack spacing={2}>
        <BackToFeed />
        <PostCardSkeleton />
      </Stack>
    }
  >
    <ConnectedPostDetail activityId={activityId} />
  </RequireFeedsClient>
);
