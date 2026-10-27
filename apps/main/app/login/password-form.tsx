"use client";

import { useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth } from "../../lib/firebase-client";
import { authErrorMessage, startSession } from "../../lib/start-session";

type Mode = "signin" | "signup" | "reset";

const SUBMIT_LABEL: Record<Mode, string> = {
  signin: "Iniciar sesión",
  signup: "Crear cuenta",
  reset: "Enviar enlace para cambiarla",
};

export const PasswordForm = ({ next }: { next: string }) => {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (value: Mode) => {
    setMode(value);
    setError(null);
    setNotice(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    const auth = getFirebaseAuth();
    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);
        setNotice(
          "Si existe una cuenta con ese correo, te enviamos un enlace para cambiar la contraseña.",
        );
        setLoading(false);
        return;
      }
      if (mode === "signup") {
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await updateProfile(user, { displayName: name.trim() });
        // El correo con contraseña no está verificado hasta que el usuario
        // abre este enlace; un correo no verificado nunca da permisos de admin.
        await sendEmailVerification(user);
        await startSession(user, next, true);
        return;
      }
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      await startSession(user, next);
    } catch (error) {
      setError(authErrorMessage(error));
      setLoading(false);
    }
  };

  return (
    <Stack component="form" spacing={2} onSubmit={submit} noValidate={false}>
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="success">{notice}</Alert>}

      {mode === "signup" && (
        <TextField
          label="Nombre"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
          slotProps={{ htmlInput: { maxLength: 60 } }}
        />
      )}
      <TextField
        label="Correo"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
      />
      {mode !== "reset" && (
        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          slotProps={{ htmlInput: { minLength: 6 } }}
        />
      )}

      <Button
        type="submit"
        variant="outlined"
        size="large"
        fullWidth
        disabled={loading}
      >
        {loading ? "Un momento…" : SUBMIT_LABEL[mode]}
      </Button>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: "center" }}
      >
        {mode === "signin" ? (
          <>
            ¿No tienes cuenta?{" "}
            <Link
              component="button"
              type="button"
              onClick={() => switchMode("signup")}
            >
              Regístrate
            </Link>
            {" · "}
            <Link
              component="button"
              type="button"
              onClick={() => switchMode("reset")}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </>
        ) : (
          <>
            {mode === "signup" ? "¿Ya tienes cuenta? " : "¿La recordaste? "}
            <Link
              component="button"
              type="button"
              onClick={() => switchMode("signin")}
            >
              Inicia sesión
            </Link>
          </>
        )}
      </Typography>
    </Stack>
  );
};
