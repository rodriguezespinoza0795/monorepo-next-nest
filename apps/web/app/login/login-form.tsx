"use client";

import { useState } from "react";
import { SignInCard } from "@repo/ui/sign-in-card";
import { authClient } from "../../lib/auth-client";

export const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/feed",
    });
    if (error) {
      setError("No pudimos iniciar sesión. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <SignInCard
      title="Únete a la comunidad"
      description="Accede con tu cuenta para leer y participar en las conversaciones."
      onGoogleSignIn={signInWithGoogle}
      loading={loading}
      error={error}
    />
  );
};
