import "server-only";
import { stream } from "./stream";

interface UserProfile {
  id: string;
  name: string;
  image?: string | null;
}

// Stream: "user ... does not exist".
const isMissingUser = (error: unknown) =>
  error instanceof Error &&
  ((error as Error & { code?: number }).code === 16 ||
    error.message.includes("does not exist"));

/**
 * Sincroniza nombre e imagen del usuario en Stream sin tocar su `custom`
 * (`upsertUsers` reemplaza el usuario entero y borraría, por ejemplo, la
 * última visita a cada espacio). Si aún no existe, lo crea.
 */
export const syncStreamUser = async ({ id, name, image }: UserProfile) => {
  const profile = { name, image: image ?? undefined };
  try {
    const { users } = await stream.updateUsersPartial({
      users: [{ id, set: profile }],
    });
    return users[id];
  } catch (error) {
    if (!isMissingUser(error)) throw error;
    const { users } = await stream.upsertUsers([{ id, ...profile }]);
    return users[id];
  }
};
