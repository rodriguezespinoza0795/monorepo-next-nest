"use client";

import type { ElementType, ReactNode } from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import { UnreadDot } from "./unread-dot";

export interface SpaceNavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  /** Muestra un punto: hay publicaciones nuevas desde la última visita. */
  unread?: boolean;
}

interface SpaceNavProps {
  title?: string;
  items: SpaceNavItem[];
  activeHref?: string;
  /** Componente de enlace de la app (por ejemplo `next/link`). */
  linkComponent?: ElementType;
}

export const SpaceNav = ({
  title,
  items,
  activeHref,
  linkComponent = "a",
}: SpaceNavProps) => (
  <List
    dense
    aria-label={title}
    subheader={
      title ? (
        <ListSubheader
          disableSticky
          sx={{
            bgcolor: "transparent",
            color: "text.secondary",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            lineHeight: 2.5,
          }}
        >
          {title}
        </ListSubheader>
      ) : undefined
    }
  >
    {items.map((item) => {
      const active = item.href === activeHref;
      return (
        <ListItemButton
          key={item.href}
          component={linkComponent}
          href={item.href}
          selected={active}
          aria-current={active ? "page" : undefined}
          sx={{
            borderRadius: 2,
            mb: 0.5,
            "&.Mui-selected": {
              bgcolor: "rgba(99, 102, 241, 0.16)",
              "&:hover": { bgcolor: "rgba(99, 102, 241, 0.22)" },
            },
          }}
        >
          {item.icon && (
            <ListItemIcon
              sx={{
                minWidth: 32,
                color: active ? "primary.light" : "text.secondary",
              }}
            >
              {item.icon}
            </ListItemIcon>
          )}
          <ListItemText
            primary={item.label}
            slotProps={{
              primary: {
                sx: {
                  fontWeight: active || item.unread ? 600 : 500,
                  fontSize: 14,
                },
              },
            }}
          />
          {item.unread && <UnreadDot />}
        </ListItemButton>
      );
    })}
  </List>
);
