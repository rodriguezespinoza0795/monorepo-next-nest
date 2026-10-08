"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import { authClient } from "../../lib/auth-client";

export const SignOutButton = () => {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      size="small"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        router.push("/login");
      }}
    >
      Salir
    </Button>
  );
};
