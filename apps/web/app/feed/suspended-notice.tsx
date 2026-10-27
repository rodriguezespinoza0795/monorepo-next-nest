"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import BlockIcon from "@mui/icons-material/Block";
import { EmptyState } from "@repo/ui/feed/empty-state";
import { signOut } from "../session-actions";

// Lo que ve un miembro bloqueado desde el panel de moderación.
export const SuspendedNotice = () => {
  const [pending, setPending] = useState(false);

  return (
    <Container maxWidth="sm" sx={{ pt: { xs: 12, sm: 16 }, pb: 8 }}>
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <EmptyState
          icon={<BlockIcon fontSize="inherit" />}
          title="Tu cuenta está suspendida"
          description="El equipo de la comunidad suspendió tu acceso. Si crees que es un error, contáctanos."
        />
        <Button
          variant="outlined"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            await signOut();
          }}
        >
          Cerrar sesión
        </Button>
      </Stack>
    </Container>
  );
};
