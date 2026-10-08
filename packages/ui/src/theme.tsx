"use client";

import { createTheme } from "@mui/material/styles";

const accent = {
  indigo: "#6366F1",
  violet: "#8B5CF6",
};

const bodyFont = "var(--font-inter), system-ui, sans-serif";
const headingFont = "var(--font-montserrat), var(--font-inter), sans-serif";

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "dark",
    primary: { main: accent.indigo, contrastText: "#FFFFFF" },
    secondary: { main: accent.violet },
    background: { default: "#04060E", paper: "#0B0F1C" },
    text: {
      primary: "#F0F0F0",
      secondary: "rgba(250, 247, 242, 0.82)",
    },
    divider: "rgba(255, 255, 255, 0.12)",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: bodyFont,
    h1: {
      fontFamily: headingFont,
      fontWeight: 700,
      fontSize: "clamp(2.5rem, 7vw, 5.25rem)",
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      color: "#E0E7FF",
      textShadow:
        "0 2px 24px rgba(0, 0, 0, 0.9), 0 0 48px rgba(99, 102, 241, 0.45)",
    },
    h2: {
      fontFamily: headingFont,
      fontWeight: 700,
      fontSize: "clamp(2rem, 4vw, 2.75rem)",
      letterSpacing: "-0.02em",
    },
    h3: {
      fontFamily: headingFont,
      fontWeight: 600,
      fontSize: "1.25rem",
    },
    subtitle1: {
      fontSize: "1.2rem",
      lineHeight: 1.7,
      color: "rgba(250, 247, 242, 0.82)",
    },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          variants: [
            {
              props: { variant: "contained", color: "primary" },
              style: {
                backgroundImage: `linear-gradient(135deg, ${accent.indigo}, ${accent.violet})`,
                borderRadius: 10,
                fontWeight: 700,
                boxShadow: "0 8px 24px rgba(99, 102, 241, 0.35)",
                "&:hover": {
                  boxShadow: "0 10px 28px rgba(99, 102, 241, 0.5)",
                },
              },
            },
          ],
        },
        outlined: {
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          borderColor: "rgba(250, 247, 242, 0.3)",
          color: "#F0F0F0",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.14)",
            borderColor: "rgba(250, 247, 242, 0.5)",
          },
        },
        sizeLarge: { padding: "14px 30px", fontSize: "0.95rem" },
      },
    },
    MuiChip: {
      styleOverrides: {
        outlined: {
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          borderColor: "rgba(255, 255, 255, 0.18)",
          borderRadius: 100,
          backdropFilter: "blur(8px)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          backgroundImage: "none",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 16,
        },
      },
    },
  },
});

export default theme;
