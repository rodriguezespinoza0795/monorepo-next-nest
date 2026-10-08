"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  useAggregatedActivities,
  useClientConnectedUser,
  useFeedsClient,
  useNotificationStatus,
  type AggregatedActivityResponse,
} from "@stream-io/feeds-react-sdk";
import { NotificationBell } from "@repo/ui/feed/notification-bell";
import {
  NotificationList,
  type NotificationItem,
} from "@repo/ui/feed/notification-list";
import { postHref } from "../../lib/routes";
import { RequireFeedsClient } from "./require-feeds-client";

const PAGE_SIZE = 15;
const EXCERPT_LENGTH = 80;

// "Ana", "Ana y Beto", "Ana y 3 personas más".
const actorsLabel = (names: string[], total: number) => {
  const [first = "Alguien", second] = names;
  if (total <= 1) return first;
  if (total === 2 && second) return `${first} y ${second}`;
  return `${first} y ${total - 1} personas más`;
};

const ACTIONS: Record<string, [singular: string, plural: string]> = {
  reaction: ["reaccionó a tu publicación", "reaccionaron a tu publicación"],
  comment: ["comentó tu publicación", "comentaron tu publicación"],
  comment_reply: ["respondió a tu comentario", "respondieron a tu comentario"],
  mention: [
    "te mencionó en una publicación",
    "te mencionaron en una publicación",
  ],
  comment_mention: [
    "te mencionó en un comentario",
    "te mencionaron en un comentario",
  ],
};

const truncate = (text: string) =>
  text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH)}…` : text;

const toItem = (group: AggregatedActivityResponse): NotificationItem | null => {
  const latest = group.activities[0];
  const context = latest?.notification_context;
  const targetId = context?.target?.id;
  if (!latest || !targetId) return null;

  const actors = [
    ...new Map(group.activities.map((a) => [a.user.id, a.user])).values(),
  ];
  const names = actors.map((actor) => actor.name ?? actor.id);
  const action = ACTIONS[latest.type];
  const verb = action
    ? action[group.user_count > 1 ? 1 : 0]
    : (context?.trigger?.text ?? "");
  const excerpt = context?.trigger?.comment?.comment ?? context?.target?.text;

  return {
    id: group.group,
    actors: actors.map((actor) => ({
      name: actor.name ?? actor.id,
      image: actor.image,
    })),
    message: `${actorsLabel(names, group.user_count)} ${verb}`,
    excerpt: excerpt ? truncate(excerpt) : undefined,
    updatedAt: new Date(group.updated_at),
    read: group.is_read ?? false,
    href: postHref(targetId),
  };
};

const ConnectedNotificationsMenu = () => {
  const client = useFeedsClient();
  const user = useClientConnectedUser();
  const feed = useMemo(
    () => (client && user ? client.feed("notification", user.id) : undefined),
    [client, user],
  );
  const {
    aggregated_activities = [],
    is_loading,
    has_next_page,
    loadNextPage,
  } = useAggregatedActivities(feed) ?? {};
  const { unseen = 0 } = useNotificationStatus(feed) ?? {};

  useEffect(() => {
    if (!client || !feed) return;
    feed.getOrCreate({ watch: true, limit: PAGE_SIZE }).catch((error) => {
      console.error("[stream] no se pudieron cargar las notificaciones", error);
    });
    return () => {
      void client
        .stopWatchingFeed({ feed_group_id: "notification", feed_id: feed.id })
        .catch(() => {});
    };
  }, [client, feed]);

  const items = aggregated_activities.flatMap((group) => {
    const item = toItem(group);
    return item ? [item] : [];
  });

  const mark = (
    request: Parameters<NonNullable<typeof feed>["markActivity"]>[0],
  ) =>
    feed?.markActivity(request).catch((error: unknown) => {
      console.error("[stream] no se pudieron marcar las notificaciones", error);
    });

  return (
    <NotificationBell
      unseen={unseen}
      onOpen={() => {
        if (unseen > 0) void mark({ mark_all_seen: true });
      }}
    >
      {(close) => (
        <NotificationList
          items={items}
          loading={is_loading}
          hasMore={has_next_page}
          onLoadMore={() => void loadNextPage?.()}
          onItemClick={(item) => {
            if (!item.read) void mark({ mark_read: [item.id] });
            close();
          }}
          onMarkAllRead={() => void mark({ mark_all_read: true })}
          linkComponent={Link}
        />
      )}
    </NotificationBell>
  );
};

export const NotificationsMenu = () => (
  <RequireFeedsClient
    fallback={
      <NotificationBell unseen={0}>
        {() => <NotificationList items={[]} loading />}
      </NotificationBell>
    }
  >
    <ConnectedNotificationsMenu />
  </RequireFeedsClient>
);
