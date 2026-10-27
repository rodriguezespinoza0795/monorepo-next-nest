"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import GoogleIcon from "@mui/icons-material/Google";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { MAIN_BRAND } from "../../lib/brand";
import { getFirebaseAuth } from "../../lib/firebase-client";
import {
  authErrorMessage,
  isPopupClosed,
  startSession,
} from "../../lib/start-session";
import { MagicLinkForm } from "./magic-link-form";
import { PasswordForm } from "./password-form";

type Method = "password" | "link";

export const LoginForm = ({ next }: { next: string }) => {
  const [method, setMethod] = useState<Method>("password");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { user } = await signInWithPopup(
        getFirebaseAuth(),
        new GoogleAuthProvider(),
      );
      await startSession(user, next);
    } catch (error) {
      if (!isPopupClosed(error)) setError(authErrorMessage(error));
      setGoogleLoading(false);
    }
  };

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: 440,
        px: { xs: 3, sm: 5 },
        py: { xs: 5, sm: 6 },
        backdropFilter: "blur(12px)",
      }}
    >
      <Stack spacing={3}>
        <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center" }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              mb: 1,
              borderRadius: "50%",
              bgcolor: "primary.main",
              boxShadow: "0 0 24px rgba(99, 102, 241, 0.8)",
            }}
          />
          <Typography variant="h2" component="h1" sx={{ fontSize: "1.9rem" }}>
            Accede a {MAIN_BRAND.name}
          </Typography>
          <Typography color="text.secondary">
            Una sola cuenta para la app y la comunidad.
          </Typography>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={googleLoading}
          onClick={signInWithGoogle}
          startIcon={
            googleLoading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <GoogleIcon />
            )
          }
        >
          Continuar con Google
        </Button>

        <Divider sx={{ color: "text.secondary", fontSize: 14 }}>
          o con tu correo
        </Divider>

        <Tabs
          value={method}
          onChange={(_, value: Method) => setMethod(value)}
          variant="fullWidth"
          aria-label="Método de acceso con correo"
        >
          <Tab value="password" label="Contraseña" />
          <Tab value="link" label="Enlace mágico" />
        </Tabs>

        {method === "password" ? (
          <PasswordForm next={next} />
        ) : (
          <MagicLinkForm next={next} />
        )}
      </Stack>
    </Card>
  );
};
