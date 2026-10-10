"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import {
  useClientConnectedUser,
  useFeedsClient,
  useStateStore,
} from "@stream-io/feeds-react-sdk";
import { timelineFid } from "../../lib/feeds";
import { RequireFeedsClient } from "./require-feeds-client";
import { reportError } from "../../lib/report-error";

// Unirse / salir de un espacio = que el timeline del miembro siga o deje de
// seguir el feed del espacio. Lo permiten los permisos de Stream (`follow`).
const ConnectedSpaceMembershipButton = ({ spaceId }: { spaceId: string }) => {
  const client = useFeedsClient();
  const user = useClientConnectedUser();
  // Misma instancia que usa la lista del espacio (el cliente la reutiliza).
  const spaceFeed = client?.feed("space", spaceId);
  // Sin unirse, Stream omite `own_follows` (no lo manda vacío): se distingue
  // "cargando" de "no unido" con `created_at`, que llega al cargar el feed.
  const { loaded, own_follows = [] } =
    useStateStore(spaceFeed?.state, (state) => ({
      loaded: state.created_at !== undefined,
      own_follows: state.own_follows,
    })) ?? {};
  const [pending, setPending] = useState(false);

  if (!client || !user || !loaded) return null;

  const timeline = timelineFid(user.id);
  const joined = own_follows.some(
    (follow) => follow.source_feed.feed === timeline,
  );

  const toggle = async () => {
    setPending(true);
    try {
      const timelineFeed = client.feed("timeline", user.id);
      if (joined) await timelineFeed.unfollow(`space:${spaceId}`);
      else await timelineFeed.follow(`space:${spaceId}`);
    } catch (error) {
      reportError("[stream] no se pudo cambiar la membresía", error);
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      variant={joined ? "outlined" : "contained"}
      onClick={() => void toggle()}
      disabled={pending}
      sx={{ flexShrink: 0 }}
    >
      {joined ? "Salir del espacio" : "Unirme"}
    </Button>
  );
};

export const SpaceMembershipButton = ({ spaceId }: { spaceId: string }) => (
  <RequireFeedsClient>
    <ConnectedSpaceMembershipButton spaceId={spaceId} />
  </RequireFeedsClient>
);
