"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import {
  StreamFeed,
  useFeedActivities,
  useFeedsClient,
  type Feed,
} from "@stream-io/feeds-react-sdk";
import { EmptyState } from "@repo/ui/feed/empty-state";
import { PostCardSkeleton } from "@repo/ui/feed/post-card-skeleton";
import { ActivityPostCard } from "./activity-post-card";
import { ConnectedPostComposer } from "./connected-post-composer";

const PAGE_SIZE = 10;

interface ActivityFeedProps {
  groupId: "timeline" | "space";
  feedId: string;
  title: string;
  description: string;
  /** Espacios donde el usuario puede publicar desde este feed. */
  postableSpaces?: { id: string; name: string }[];
}

const ActivityList = ({
  feed,
  showSpace,
}: {
  feed: Feed;
  showSpace: boolean;
}) => {
  const { activities, is_loading, has_next_page, loadNextPage } =
    useFeedActivities(feed);
  const sentinel = useRef<HTMLDivElement>(null);

  // Scroll infinito: carga la siguiente página al acercarse al final.
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !has_next_page) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void loadNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [has_next_page, loadNextPage]);

  if (!activities || activities.length === 0) {
    return (
      <EmptyState
        icon={<ForumOutlinedIcon fontSize="inherit" />}
        title="Todavía no hay publicaciones"
        description="Cuando alguien publique en este espacio, lo verás aquí."
      />
    );
  }

  return (
    <Stack spacing={2}>
      {activities.map((activity) => (
        <ActivityPostCard
          key={activity.id}
          activity={activity}
          showSpace={showSpace}
          linkToDetail
        />
      ))}
      <Box ref={sentinel} />
      {has_next_page && (
        <Button
          variant="outlined"
          onClick={() => void loadNextPage()}
          disabled={is_loading}
          startIcon={
            is_loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
          sx={{ alignSelf: "center" }}
        >
          Cargar más
        </Button>
      )}
    </Stack>
  );
};

export const ActivityFeed = ({
  groupId,
  feedId,
  title,
  description,
  postableSpaces = [],
}: ActivityFeedProps) => {
  const client = useFeedsClient();
  // El SDK empieza con `activities = []` antes de responder; sin este estado
  // se vería "no hay publicaciones" mientras carga.
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  const feed = useMemo(
    () => client?.feed(groupId, feedId),
    [client, groupId, feedId],
  );

  useEffect(() => {
    if (!client || !feed) return;
    let cancelled = false;
    setStatus("loading");
    feed
      .getOrCreate({ watch: true, limit: PAGE_SIZE })
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((err: unknown) => {
        console.error("[stream] no se pudo cargar el feed", err);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      void client
        .stopWatchingFeed({ feed_group_id: groupId, feed_id: feedId })
        .catch(() => {});
    };
  }, [client, feed, groupId, feedId]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography
          variant="h2"
          component="h1"
          sx={{ fontSize: { xs: "1.75rem", sm: "2rem" } }}
        >
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Box>

      {postableSpaces.length > 0 && (
        <ConnectedPostComposer spaces={postableSpaces} />
      )}

      {status === "error" && (
        <Alert severity="error">
          No pudimos cargar las publicaciones. Recarga la página para intentarlo
          de nuevo.
        </Alert>
      )}
      {status === "loading" && (
        <Stack spacing={2}>
          <PostCardSkeleton />
          <PostCardSkeleton />
        </Stack>
      )}
      {status === "ready" && feed && (
        <StreamFeed feed={feed}>
          <ActivityList feed={feed} showSpace={groupId === "timeline"} />
        </StreamFeed>
      )}
    </Stack>
  );
};
