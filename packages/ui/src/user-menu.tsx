"use client";

import { useState, type ElementType, type ReactNode } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

export interface UserMenuItem {
  label: string;
  icon?: ReactNode;
  /** Enlace (por ejemplo "Mi perfil")… */
  href?: string;
  /** …o acción (por ejemplo "Cerrar sesión"). */
  onClick?: () => void;
}

interface UserMenuProps {
  name: string;
  image?: string;
  /** Línea secundaria bajo el nombre (por ejemplo, el correo). */
  detail?: string;
  items: UserMenuItem[];
  linkComponent?: ElementType;
}

/** Avatar en el encabezado que abre el menú de la cuenta. */
export const UserMenu = ({
  name,
  image,
  detail,
  items,
  linkComponent = "a",
}: UserMenuProps) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);

  return (
    <>
      <IconButton
        aria-label={`Cuenta de ${name}`}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ p: 0.5 }}
      >
        <Avatar src={image} alt={name} sx={{ width: 32, height: 32 }}>
          {name.charAt(0)}
        </Avatar>
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
              mt: 1,
              minWidth: 220,
              maxWidth: "calc(100vw - 32px)",
              bgcolor: "background.paper",
              backgroundImage: "none",
              border: 1,
              borderColor: "divider",
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography noWrap sx={{ fontWeight: 600 }}>
            {name}
          </Typography>
          {detail && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {detail}
            </Typography>
          )}
        </Box>
        <Divider />
        {items.map((item) => (
          <MenuItem
            key={item.label}
            component={item.href ? linkComponent : "li"}
            href={item.href}
            onClick={() => {
              close();
              item.onClick?.();
            }}
          >
            {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
