"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { getFirebaseAuth } from "../../../lib/firebase-client";
import {
  EMAIL_FOR_LINK_KEY,
  authErrorMessage,
  startSession,
} from "../../../lib/start-session";

type Status = "checking" | "needs-email" | "signing-in" | "error";

const readSavedEmail = () => {
  try {
    return localStorage.getItem(EMAIL_FOR_LINK_KEY);
  } catch {
    return null;
  }
};

export const EmailLinkFinish = ({ next }: { next: string }) => {
  const [status, setStatus] = useState<Status>("checking");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const finish = async (address: string) => {
    setStatus("signing-in");
    setError(null);
    try {
      const { user } = await signInWithEmailLink(
        getFirebaseAuth(),
        address,
        window.location.href,
      );
      try {
        localStorage.removeItem(EMAIL_FOR_LINK_KEY);
      } catch {
        // Nada que limpiar.
      }
      await startSession(user, next);
    } catch (error) {
      setError(authErrorMessage(error));
      setStatus("error");
    }
  };

  useEffect(() => {
    // Una sola vez (en desarrollo React monta dos veces y el enlace es de un
    // solo uso).
    if (started.current) return;
    started.current = true;
    if (!isSignInWithEmailLink(getFirebaseAuth(), window.location.href)) {
      setError("El enlace no es válido o ya venció. Pide uno nuevo.");
      setStatus("error");
      return;
    }
    // Abierto en otro navegador o dispositivo: no tenemos el correo guardado.
    const saved = readSavedEmail();
    if (saved) void finish(saved);
    else setStatus("needs-email");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void finish(email);
  };

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: 420,
        px: { xs: 3, sm: 5 },
        py: { xs: 5, sm: 6 },
      }}
    >
      {status === "checking" || status === "signing-in" ? (
        <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
          <CircularProgress />
          <Typography color="text.secondary">Entrando…</Typography>
        </Stack>
      ) : status === "needs-email" ? (
        <Stack component="form" spacing={2} onSubmit={submit}>
          <Typography variant="h3" component="h1">
            Confirma tu correo
          </Typography>
          <Typography color="text.secondary">
            Abriste el enlace en otro navegador. Escribe el correo al que lo
            enviamos.
          </Typography>
          <TextField
            label="Correo"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
          <Button type="submit" variant="contained" size="large" fullWidth>
            Entrar
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Alert severity="error">{error}</Alert>
          <Button
            variant="outlined"
            href={`/login?next=${encodeURIComponent(next)}`}
          >
            Volver a intentar
          </Button>
        </Stack>
      )}
    </Card>
  );
};
