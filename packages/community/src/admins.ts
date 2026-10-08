import "server-only";

// Administradores de la comunidad: lista de correos en `ADMIN_EMAILS`,
// separados por coma. La usan `web` (publicar en espacios solo-admin) y
// `admin` (acceso al panel de moderación). Ver docs/reglas-de-negocio.md.
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export const isAdmin = (email: string) => adminEmails.has(email.toLowerCase());
