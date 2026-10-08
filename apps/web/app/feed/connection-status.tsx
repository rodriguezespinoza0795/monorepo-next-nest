"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  useClientConnectedUser,
  useWsConnectionState,
} from "@stream-io/feeds-react-sdk";
import { authClient } from "../../lib/auth-client";

// Provisional (PR 1): confirma que el usuario quedó conectado a Stream.
// En el PR 2 se reemplaza por el feed.
export const ConnectionStatus = () => {
  const router = useRouter();
  const user = useClientConnectedUser();
  const { is_healthy } = useWsConnectionState();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <Card sx={{ p: { xs: 3, sm: 4 } }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Avatar src={user?.image} alt={user?.name}>
            {user?.name?.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" noWrap>
              {user?.name ?? "Conectando…"}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: is_healthy ? "success.main" : "warning.main",
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {is_healthy ? "Conectado a Stream" : "Conectando a Stream…"}
              </Typography>
            </Stack>
          </Box>
        </Stack>
        <Typography color="text.secondary">
          Muy pronto verás aquí las publicaciones de la comunidad.
        </Typography>
        <Button
          variant="outlined"
          onClick={signOut}
          disabled={signingOut}
          sx={{ alignSelf: "flex-start" }}
        >
          Cerrar sesión
        </Button>
      </Stack>
    </Card>
  );
};
