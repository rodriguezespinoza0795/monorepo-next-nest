import "server-only";

const allowedHosts = (process.env.ALLOWED_REDIRECT_HOSTS || "localhost")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

// Destino seguro para `?next=`: una ruta de esta app o una URL de un host
// permitido (la comunidad o el panel). Cualquier otra cosa vuelve al inicio,
// para que el login no sirva para redirigir a sitios ajenos.
export const safeNext = (next: string | string[] | undefined): string => {
  if (typeof next !== "string" || !next) return "/";
  if (
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
  ) {
    return next;
  }
  try {
    const url = new URL(next);
    const local = url.hostname === "localhost";
    const protocolOk =
      url.protocol === "https:" || (local && url.protocol === "http:");
    if (protocolOk && allowedHosts.includes(url.hostname))
      return url.toString();
  } catch {
    // No es una URL: se ignora.
  }
  return "/";
};
