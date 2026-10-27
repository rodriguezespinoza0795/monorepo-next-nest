"use client";

import { useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { sendSignInLinkToEmail } from "firebase/auth";
import { getFirebaseAuth } from "../../lib/firebase-client";
import { EMAIL_FOR_LINK_KEY, authErrorMessage } from "../../lib/start-session";

export const MagicLinkForm = ({ next }: { next: string }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/login/enlace", window.location.origin);
      url.searchParams.set("next", next);
      await sendSignInLinkToEmail(getFirebaseAuth(), email, {
        url: url.toString(),
        handleCodeInApp: true,
      });
      try {
        localStorage.setItem(EMAIL_FOR_LINK_KEY, email);
      } catch {
        // Sin almacenamiento: al volver se le pide el correo de nuevo.
      }
      setSentTo(email);
    } catch (error) {
      setError(authErrorMessage(error));
    }
    setLoading(false);
  };

  if (sentTo) {
    return (
      <Alert severity="success">
        Te enviamos un enlace a <strong>{sentTo}</strong>. Ábrelo en este mismo
        navegador para entrar.
      </Alert>
    );
  }

  return (
    <Stack component="form" spacing={2} onSubmit={submit}>
      {error && <Alert severity="error">{error}</Alert>}
      <Typography variant="body2" color="text.secondary">
        Sin contraseña: te enviamos un enlace para entrar con un clic.
      </Typography>
      <TextField
        label="Correo"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
      />
      <Button
        type="submit"
        variant="outlined"
        size="large"
        fullWidth
        disabled={loading}
      >
        {loading ? "Enviando…" : "Enviar enlace mágico"}
      </Button>
    </Stack>
  );
};
