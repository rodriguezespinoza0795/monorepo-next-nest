"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { addComment, deleteOwnComment, updateComment } from "../../actions";
import { ActivityPostCard } from "../../activity-post-card";
import { RequireFeedsClient } from "../../require-feeds-client";
import { useMentions } from "../../use-mentions";
import { linkPreviewsOf } from "@repo/community/attachments";
import { isEdited } from "../../../../lib/edited";
import { useOwnContent } from "../../use-own-content";
import {
  commentLikeCount,
  isCommentLikedByMe,
  useToggleCommentLike,
} from "../../use-toggle-comment-like";
import { reportError } from "../../../../lib/report-error";

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

// Vuelve a cargar la publicación y sus comentarios. Los comentarios se crean
// en el servidor, así que el estado del SDK no se entera solo.
const RefreshCommentsContext = createContext<() => Promise<void>>(
  async () => {},
);

// Composer de comentario o respuesta (se envía por la server action).
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
  const [error, setError] = useState<string | null>(null);
  const mentions = useMentions();
  const refreshComments = useContext(RefreshCommentsContext);

  if (!client || !user) return null;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const result = await addComment({
      activityId,
      text,
      parentId,
      mentionedUserIds: mentions.mentionedIds(text),
    }).catch(() => ({
      ok: false as const,
      error: "No pudimos enviar tu comentario. Inténtalo de nuevo.",
    }));
    if (result.ok) {
      await refreshComments();
      setText("");
      mentions.reset();
      onDone?.();
    } else {
      setError(result.error);
    }
    setSubmitting(false);
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
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
};

// Un comentario o respuesta; si es propio, con "Editar" y "Eliminar".
const ConnectedCommentItem = ({
  comment,
  onReply,
  children,
}: {
  comment: CommentResponse;
  onReply: () => void;
  children?: ReactNode;
}) => {
  const me = useClientConnectedUser();
  const refreshComments = useContext(RefreshCommentsContext);
  const own = useOwnContent({
    kind: "comment",
    text: comment.text ?? "",
    mentions: comment.mentioned_users.map((user) => ({
      id: user.id,
      name: user.name ?? user.id,
      image: user.image,
    })),
    maxLength: MAX_COMMENT_LENGTH,
    save: (text, mentionedUserIds) =>
      updateComment({ commentId: comment.id, text, mentionedUserIds }),
    remove: () => deleteOwnComment(comment.id),
    onSaved: refreshComments,
    onDeleted: refreshComments,
  });
  const isMine = me?.id === comment.user.id && comment.status !== "deleted";
  const toggleLike = useToggleCommentLike();

  return (
    <CommentItem
      linkComponent={Link}
      author={authorOf(comment)}
      createdAt={new Date(comment.created_at)}
      text={comment.text}
      mentions={mentionsOf(comment)}
      deleted={comment.status === "deleted"}
      edited={isEdited(comment)}
      linkPreviews={linkPreviewsOf(comment.attachments, comment.text)}
      onReply={onReply}
      likeCount={commentLikeCount(comment)}
      liked={isCommentLikedByMe(comment)}
      onToggleLike={() => void toggleLike(comment)}
      menu={isMine ? own.menu : undefined}
      editor={isMine ? own.editor : undefined}
    >
      {isMine && own.error && <Alert severity="error">{own.error}</Alert>}
      {isMine && own.dialog}
      {children}
    </CommentItem>
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
    <ConnectedCommentItem comment={comment} onReply={() => setReplying(true)}>
      {replies.length > 0 &&
        replies.map((reply) => (
          <ConnectedCommentItem
            key={reply.id}
            comment={reply}
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
    </ConnectedCommentItem>
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
  const router = useRouter();
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

  // `version` sube para recargar (tras comentar). La instancia nueva se
  // muestra cuando ya trae los datos, así la pantalla no parpadea.
  const [version, setVersion] = useState(0);
  const pendingRefreshes = useRef<(() => void)[]>([]);
  const refreshComments = () =>
    new Promise<void>((resolve) => {
      pendingRefreshes.current.push(resolve);
      setVersion((current) => current + 1);
    });

  useEffect(() => {
    if (!client) return;
    const instance = client.activityWithStateUpdates(activityId);
    let cancelled = false;
    const settle = () => {
      pendingRefreshes.current.splice(0).forEach((resolve) => resolve());
    };
    if (version === 0) setStatus("loading");
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
        if (cancelled) return;
        setActivityWithState(instance);
        setStatus("ready");
        settle();
      })
      .catch((error: unknown) => {
        reportError("[stream] no se pudo cargar la publicación", error);
        if (!cancelled) setStatus("error");
        settle();
      });
    return () => {
      cancelled = true;
      instance.dispose();
    };
  }, [client, activityId, version]);

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
        <RefreshCommentsContext value={refreshComments}>
          <ActivityPostCard
            activity={activity}
            showSpace
            onChanged={refreshComments}
            onDeleted={() => router.push("/feed")}
          />
          <Comments activity={activityWithState} />
        </RefreshCommentsContext>
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
