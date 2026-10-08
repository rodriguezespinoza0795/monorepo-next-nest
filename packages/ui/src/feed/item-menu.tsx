"use client";

import { useState, type ReactNode } from "react";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

export interface ItemMenuAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  /** Acción delicada (por ejemplo, eliminar): se muestra en rojo. */
  destructive?: boolean;
}

/** Menú "⋯" con acciones sobre una publicación o un comentario. */
export const ItemMenu = ({
  label,
  actions,
}: {
  /** Nombre accesible del botón, por ejemplo "Opciones de la publicación". */
  label: string;
  actions: ItemMenuAction[];
}) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);

  return (
    <>
      <IconButton
        size="small"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ color: "text.secondary" }}
      >
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 180,
              bgcolor: "background.paper",
              backgroundImage: "none",
              border: 1,
              borderColor: "divider",
            },
          },
        }}
      >
        {actions.map((action) => (
          <MenuItem
            key={action.label}
            onClick={() => {
              close();
              action.onClick();
            }}
            sx={action.destructive ? { color: "error.light" } : undefined}
          >
            {action.icon && (
              <ListItemIcon sx={{ color: "inherit" }}>
                {action.icon}
              </ListItemIcon>
            )}
            <ListItemText primary={action.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
