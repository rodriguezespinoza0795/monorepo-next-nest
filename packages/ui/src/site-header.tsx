"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import useScrollTrigger from "@mui/material/useScrollTrigger";

interface NavLink {
  label: string;
  href: string;
}

interface SiteHeaderProps {
  brand: string;
  links?: NavLink[];
  action: NavLink;
}

export const SiteHeader = ({ brand, links = [], action }: SiteHeaderProps) => {
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 24 });

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
            spacing={3}
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
            <Button variant="outlined" size="small" href={action.href}>
              {action.label}
            </Button>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
