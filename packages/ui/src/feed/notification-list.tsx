"use client";

import type { ElementType } from "react";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { RelativeTime } from "./relative-time";

export interface NotificationItem {
  id: string;
  actors: { name: string; image?: string }[];
  /** Frase completa, por ejemplo "Ana y Beto comentaron tu publicación". */
  message: string;
  /** Extracto del comentario o de la publicación. */
  excerpt?: string;
  updatedAt: Date;
  read: boolean;
  href: string;
}

interface NotificationListProps {
  items: NotificationItem[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onItemClick?: (item: NotificationItem) => void;
  onMarkAllRead?: () => void;
  linkComponent?: ElementType;
}

export const NotificationList = ({
  items,
  loading = false,
  hasMore = false,
  onLoadMore,
  onItemClick,
  onMarkAllRead,
  linkComponent = "a",
}: NotificationListProps) => {
  const anyUnread = items.some((item) => !item.read);

  return (
    <>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.5,
          py: 1.5,
        }}
      >
        <Typography variant="h3" component="h2" sx={{ fontSize: 17 }}>
          Notificaciones
        </Typography>
        {onMarkAllRead && anyUnread && (
          <Button size="small" onClick={onMarkAllRead} sx={{ mr: -1 }}>
            Marcar todo como leído
          </Button>
        )}
      </Stack>
      <Divider />

      <Box sx={{ overflowY: "auto" }}>
        {items.length === 0 && !loading && (
          <Typography
            color="text.secondary"
            sx={{ px: 2.5, py: 5, textAlign: "center" }}
          >
            Aquí verás cuando alguien comente, reaccione o te mencione.
          </Typography>
        )}

        <List disablePadding>
          {items.map((item) => (
            <ListItemButton
              key={item.id}
              component={linkComponent}
              href={item.href}
              onClick={() => onItemClick?.(item)}
              sx={{
                alignItems: "flex-start",
                gap: 1.5,
                px: 2.5,
                py: 1.5,
                bgcolor: item.read ? "transparent" : "rgba(99, 102, 241, 0.08)",
              }}
            >
              <AvatarGroup
                max={2}
                spacing="small"
                sx={{
                  flexShrink: 0,
                  "& .MuiAvatar-root": { width: 32, height: 32, fontSize: 14 },
                }}
              >
                {item.actors.map((actor, index) => (
                  <Avatar key={index} src={actor.image} alt={actor.name}>
                    {actor.name.charAt(0)}
                  </Avatar>
                ))}
              </AvatarGroup>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                  {item.message}
                </Typography>
                {item.excerpt && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    sx={{ fontStyle: "italic" }}
                  >
                    «{item.excerpt}»
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  <RelativeTime date={item.updatedAt} />
                </Typography>
              </Box>
              {!item.read && (
                <Box
                  aria-label="Sin leer"
                  sx={{
                    mt: 1,
                    width: 8,
                    height: 8,
                    flexShrink: 0,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                  }}
                />
              )}
            </ListItemButton>
          ))}
        </List>

        {loading && (
          <Stack sx={{ alignItems: "center", py: 3 }}>
            <CircularProgress size={24} aria-label="Cargando notificaciones" />
          </Stack>
        )}
        {hasMore && !loading && (
          <Stack sx={{ alignItems: "center", py: 1.5 }}>
            <Button size="small" onClick={onLoadMore}>
              Ver anteriores
            </Button>
          </Stack>
        )}
      </Box>
    </>
  );
};
