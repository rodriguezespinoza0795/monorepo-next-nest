import "server-only";

// Administradores: lista de correos en `ADMIN_EMAILS`, separados por coma.
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export const isAdmin = (email: string) => adminEmails.has(email.toLowerCase());
