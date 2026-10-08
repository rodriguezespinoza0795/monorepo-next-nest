"use client";

import { useState, type ReactNode } from "react";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

interface NotificationBellProps {
  /** Notificaciones sin ver (el número del globo). */
  unseen: number;
  /** Se llama al abrir el panel (para marcarlas como vistas). */
  onOpen?: () => void;
  /** Contenido del panel; recibe cómo cerrarlo. */
  children: (close: () => void) => ReactNode;
}

export const NotificationBell = ({
  unseen,
  onOpen,
  children,
}: NotificationBellProps) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);

  return (
    <>
      <IconButton
        aria-label={
          unseen > 0 ? `Notificaciones (${unseen} nuevas)` : "Notificaciones"
        }
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => {
          setAnchor(event.currentTarget);
          onOpen?.();
        }}
      >
        <Badge
          badgeContent={unseen}
          max={99}
          color="primary"
          sx={{
            "& .MuiBadge-badge": {
              backgroundImage: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              fontWeight: 700,
            },
          }}
        >
          <NotificationsNoneIcon />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            role: "dialog",
            "aria-label": "Notificaciones",
            sx: {
              mt: 1,
              width: 380,
              maxWidth: "calc(100vw - 32px)",
              maxHeight: "min(560px, calc(100vh - 96px))",
              display: "flex",
              flexDirection: "column",
              bgcolor: "background.paper",
              backgroundImage: "none",
              border: 1,
              borderColor: "divider",
              borderRadius: 3,
            },
          },
        }}
      >
        {children(close)}
      </Popover>
    </>
  );
};
