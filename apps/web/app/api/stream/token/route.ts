import { getSession } from "../../../../lib/session";
import { syncStreamUser } from "@repo/community/users";
import { stream } from "../../../../lib/stream";

const TOKEN_VALIDITY_SECONDS = 60 * 60;

// Firma un token de Stream para el usuario con sesión y sincroniza su perfil.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const { streamId, name, image } = session.user;
  const user = await syncStreamUser({ id: streamId, name, image });
  // Bloqueado desde moderación: sin token no se conecta a Stream.
  if (user?.banned) {
    return Response.json({ error: "Cuenta suspendida" }, { status: 403 });
  }

  const token = stream.generateUserToken({
    user_id: streamId,
    validity_in_seconds: TOKEN_VALIDITY_SECONDS,
  });

  return Response.json({ token, user: { id: streamId, name, image } });
}
