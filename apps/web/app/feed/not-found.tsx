"use client";

import Link from "next/link";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { EmptyState } from "@repo/ui/feed/empty-state";

export default function FeedNotFound() {
  return (
    <Stack spacing={2} sx={{ alignItems: "center" }}>
      <EmptyState
        icon={<SearchOffIcon fontSize="inherit" />}
        title="No encontramos esta página"
        description="El espacio o el perfil que buscas no existe."
      />
      <Button variant="outlined" component={Link} href="/feed">
        Volver al Inicio
      </Button>
    </Stack>
  );
}
