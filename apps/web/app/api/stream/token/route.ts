import { headers } from "next/headers";
import { auth } from "../../../../lib/auth";
import { stream } from "../../../../lib/stream";

const TOKEN_VALIDITY_SECONDS = 60 * 60;

// Firma un token de Stream para el usuario con sesión y sincroniza su perfil.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const { streamId, name, image } = session.user;
  await stream.upsertUsers([{ id: streamId, name, image: image ?? undefined }]);

  const token = stream.generateUserToken({
    user_id: streamId,
    validity_in_seconds: TOKEN_VALIDITY_SECONDS,
  });

  return Response.json({ token, user: { id: streamId, name, image } });
}
