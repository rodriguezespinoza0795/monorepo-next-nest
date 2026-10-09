"use client";

import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { UnreadDot } from "./unread-dot";
import Container from "@mui/material/Container";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import CloseIcon from "@mui/icons-material/Close";
import TagIcon from "@mui/icons-material/Tag";

interface FeedLayoutProps {
  /** Navegación lateral; en móvil se abre en un drawer. */
  nav: ReactNode;
  /** Columna derecha; solo se muestra en pantallas grandes. */
  aside?: ReactNode;
  /** Hay publicaciones nuevas en algún espacio (punto en el botón móvil). */
  unread?: boolean;
  children: ReactNode;
}

const NAV_WIDTH = 240;
const ASIDE_WIDTH = 300;

export const FeedLayout = ({
  nav,
  aside,
  unread = false,
  children,
}: FeedLayoutProps) => {
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = () => setNavOpen(false);

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 9, sm: 11 }, pb: 8 }}>
      <Box
        sx={{
          display: "grid",
          gap: { xs: 2, md: 4 },
          alignItems: "start",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: `${NAV_WIDTH}px minmax(0, 1fr)`,
            lg: aside
              ? `${NAV_WIDTH}px minmax(0, 1fr) ${ASIDE_WIDTH}px`
              : `${NAV_WIDTH}px minmax(0, 1fr)`,
          },
        }}
      >
        <Box
          component="nav"
          aria-label="Espacios"
          sx={{
            display: { xs: "none", md: "block" },
            position: "sticky",
            top: 88,
          }}
        >
          {nav}
        </Box>

        <Box component="main" sx={{ minWidth: 0 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TagIcon />}
            onClick={() => setNavOpen(true)}
            aria-controls="feed-nav"
            aria-expanded={navOpen}
            endIcon={unread ? <UnreadDot /> : undefined}
            sx={{ display: { md: "none" }, mb: 2 }}
          >
            Espacios
          </Button>
          {children}
        </Box>

        {aside && (
          <Box
            component="aside"
            sx={{
              display: { xs: "none", lg: "block" },
              position: "sticky",
              top: 88,
            }}
          >
            {aside}
          </Box>
        )}
      </Box>

      <Drawer
        id="feed-nav"
        anchor="left"
        open={navOpen}
        onClose={closeNav}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              bgcolor: "background.default",
              backgroundImage: "none",
              borderRight: 1,
              borderColor: "divider",
            },
          },
        }}
      >
        <Stack direction="row" sx={{ justifyContent: "flex-end", p: 1 }}>
          <IconButton aria-label="Cerrar espacios" onClick={closeNav}>
            <CloseIcon />
          </IconButton>
        </Stack>
        {/* Cierra el drawer al elegir un enlace. */}
        <Box
          component="nav"
          aria-label="Espacios"
          onClick={closeNav}
          sx={{ px: 1 }}
        >
          {nav}
        </Box>
      </Drawer>
    </Container>
  );
};
