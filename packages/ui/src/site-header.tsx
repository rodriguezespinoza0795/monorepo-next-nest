"use client";

import { useState, type ReactNode } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";

interface NavLink {
  label: string;
  href: string;
}

interface SiteHeaderProps {
  brand: string;
  links?: NavLink[];
  /** Botón principal (por ejemplo "Acceder"); se omite con sesión iniciada. */
  action?: NavLink;
  /** Controles extra junto al botón de acción (por ejemplo, notificaciones). */
  extra?: ReactNode;
}

export const SiteHeader = ({
  brand,
  links = [],
  action,
  extra,
}: SiteHeaderProps) => {
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 24 });
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: scrolled ? "rgba(20, 20, 20, 0.92)" : "transparent",
        backgroundImage: "none",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: 1,
        borderColor: scrolled ? "divider" : "transparent",
        transition: "background-color 0.2s, border-color 0.2s",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: { xs: 56, sm: 60 } }}>
          <Link
            href="/"
            underline="none"
            color="text.primary"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontWeight: 600,
              fontSize: "1.05rem",
            }}
          >
            <Box
              component="span"
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "primary.main",
              }}
            />
            {brand}
          </Link>

          <Stack
            direction="row"
            spacing={{ xs: 1.5, sm: 3 }}
            sx={{ ml: "auto", alignItems: "center" }}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                underline="none"
                sx={{
                  display: { xs: "none", sm: "inline" },
                  fontSize: 14,
                  fontWeight: 500,
                  color: "rgba(250, 247, 242, 0.85)",
                  "&:hover": { color: "text.primary" },
                }}
              >
                {link.label}
              </Link>
            ))}
            {extra}
            {action && (
              <Button variant="outlined" size="small" href={action.href}>
                {action.label}
              </Button>
            )}
            {links.length > 0 && (
              <IconButton
                aria-label="Abrir menú"
                aria-controls="site-menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
                sx={{ display: { xs: "inline-flex", sm: "none" }, mr: -1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Stack>
        </Toolbar>
      </Container>

      <Drawer
        id="site-menu"
        anchor="right"
        open={menuOpen}
        onClose={closeMenu}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              bgcolor: "background.default",
              backgroundImage: "none",
              borderLeft: 1,
              borderColor: "divider",
            },
          },
        }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "flex-end", p: 1 }}
        >
          <IconButton aria-label="Cerrar menú" onClick={closeMenu}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <List sx={{ px: 1 }}>
          {links.map((link) => (
            <ListItemButton
              key={link.href}
              component="a"
              href={link.href}
              onClick={closeMenu}
              sx={{ borderRadius: 1.5 }}
            >
              <ListItemText
                primary={link.label}
                slotProps={{ primary: { sx: { fontWeight: 500 } } }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </AppBar>
  );
};
