import type { User } from "firebase/auth";

// Después de iniciar sesión con Firebase: crea la cookie de sesión en el
// servidor y lleva al usuario a `next` (ya validado por el servidor). Con
// `refresh`, pide un token nuevo para que incluya el nombre recién guardado.
export const startSession = async (
  user: User,
  next: string,
  refresh = false,
) => {
  const idToken = await user.getIdToken(refresh);
  const response = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  // El servidor no aceptó el token (por ejemplo, `FIREBASE_*` de otro proyecto
  // que el del navegador).
  if (!response.ok) {
    throw Object.assign(new Error("session"), { code: "session" });
  }
  window.location.assign(next);
};

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/invalid-email": "El correo no es válido.",
  "auth/email-already-in-use":
    "Ya existe una cuenta con ese correo. Inicia sesión.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos.",
  "auth/quota-exceeded":
    "Se alcanzó el límite de correos por hoy. Prueba otro método.",
  "auth/invalid-action-code":
    "El enlace no es válido o ya venció. Pide uno nuevo.",
  "auth/expired-action-code": "El enlace ya venció. Pide uno nuevo.",
  "auth/account-exists-with-different-credential":
    "Ese correo ya tiene una cuenta con otro método de acceso.",
  "auth/network-request-failed": "Sin conexión. Revisa tu internet.",
  "auth/unauthorized-domain":
    "Este sitio no está autorizado para iniciar sesión. Avisa al equipo.",
  "auth/unauthorized-continue-uri":
    "Este sitio no está autorizado para el enlace mágico. Avisa al equipo.",
  "auth/operation-not-allowed":
    "Este método de acceso no está activado. Prueba otro o avisa al equipo.",
  session:
    "Iniciaste sesión, pero no pudimos guardarla. Inténtalo de nuevo o avisa al equipo.",
};

// Mensaje en español para un error de Firebase (o del servidor). Si no lo
// conocemos, se muestra su código para poder diagnosticarlo.
export const authErrorMessage = (error: unknown) => {
  const code = (error as { code?: string } | null)?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  const detail = code ? ` (${code})` : "";
  return `No pudimos iniciar sesión. Inténtalo de nuevo.${detail}`;
};

// Si el usuario cerró la ventana de Google, no es un error que mostrar.
export const isPopupClosed = (error: unknown) => {
  const code = (error as { code?: string } | null)?.code;
  return (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request"
  );
};

// Correo guardado al pedir el enlace mágico, para completarlo al volver.
export const EMAIL_FOR_LINK_KEY = "davidre:emailForSignIn";
