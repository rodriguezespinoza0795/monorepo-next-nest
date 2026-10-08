"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import {
  StreamFeeds,
  useCreateFeedsClient,
} from "@stream-io/feeds-react-sdk";

interface FeedsProviderProps {
  user: { id: string; name: string; image?: string | null };
  children: ReactNode;
}

// El token se pide al servidor cada vez que Stream lo necesita (al conectar y
// cuando expira), así el secreto nunca llega al navegador.
const tokenProvider = async () => {
  const res = await fetch("/api/stream/token");
  if (!res.ok) throw new Error("No se pudo obtener el token de Stream");
  const { token } = (await res.json()) as { token: string };
  return token;
};

export const FeedsProvider = ({ user, children }: FeedsProviderProps) => {
  const client = useCreateFeedsClient({
    apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY as string,
    tokenOrProvider: tokenProvider,
    userData: { id: user.id, name: user.name, image: user.image ?? undefined },
  });

  if (!client) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress aria-label="Conectando" />
      </Box>
    );
  }

  return <StreamFeeds client={client}>{children}</StreamFeeds>;
};
