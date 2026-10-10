"use server";

import { headers } from "next/headers";
import { auth } from "../../lib/auth";
import { getUnreadSpaceIds, markSpaceSeen } from "../../lib/space-activity";
import { findSpace } from "../../lib/spaces";
import { reportError } from "../../lib/report-error";

// Puntos de "publicaciones nuevas" del menú de espacios. Si algo falla, no
// se muestra ningún punto (no es crítico).

export async function getUnreadSpaces(): Promise<string[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  return getUnreadSpaceIds(session.user.streamId).catch((error: unknown) => {
    reportError("[stream] no se pudieron leer los espacios nuevos", error);
    return [];
  });
}

/** Marca el espacio como visto y devuelve los que siguen con novedades. */
export async function visitSpace(spaceId: string): Promise<string[]> {
  if (typeof spaceId !== "string" || !findSpace(spaceId)) return [];
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];
  const { streamId } = session.user;
  try {
    await markSpaceSeen(streamId, spaceId);
    return await getUnreadSpaceIds(streamId);
  } catch (error) {
    reportError("[stream] no se pudo registrar la visita al espacio", error);
    return [];
  }
}
