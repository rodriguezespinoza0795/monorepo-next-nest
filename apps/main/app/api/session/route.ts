import { createSession } from "../../../lib/session";

// Crea la cookie de sesión a partir del ID token que el navegador obtiene de
// Firebase al iniciar sesión.
export async function POST(request: Request) {
  // Solo desde esta misma app: evita que otro sitio inicie una sesión ajena
  // en el navegador del usuario.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    idToken?: unknown;
  } | null;
  if (typeof body?.idToken !== "string") {
    return Response.json({ error: "Falta el token" }, { status: 400 });
  }

  const ok = await createSession(body.idToken);
  if (!ok) {
    return Response.json({ error: "Token no válido" }, { status: 401 });
  }
  return Response.json({ ok: true });
}
