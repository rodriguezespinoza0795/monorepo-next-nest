import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { AuthAdapter } from "./types";

// App de Firebase Admin propia (con nombre), para no chocar con otra que
// inicialice la app que use este paquete.
const APP_NAME = "repo-auth";

/**
 * Clave privada tal como llegue de la variable: sin comillas alrededor (las
 * de `.env.local`, si se copian a Vercel) y con los `\n` escritos convertidos
 * en saltos de línea.
 */
export const normalizePrivateKey = (value: string | undefined) =>
  value
    ?.trim()
    .replace(/^(["'])([\s\S]*)\1$/, "$2")
    .replace(/\\n/g, "\n");

const adminAuth = () => {
  const app =
    getApps().find((existing) => existing.name === APP_NAME) ??
    initializeApp(
      {
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
        }),
      },
      APP_NAME,
    );
  return getAuth(app);
};

// Sesión creada por la app principal con Firebase (`createSessionCookie`).
// Se verifica con las claves públicas de Google, sin llamar a Firebase en
// cada petición.
export const firebaseAdapter: AuthAdapter = {
  verifySession: async (cookieValue) => {
    let auth: ReturnType<typeof adminAuth>;
    try {
      auth = adminAuth();
    } catch (error) {
      // Sin esto, una variable mal puesta solo se ve como "sesión no válida".
      console.error(
        "[auth] Firebase Admin mal configurado (revisa FIREBASE_*):",
        error instanceof Error ? error.message : error,
      );
      return null;
    }
    try {
      const claims = await auth.verifySessionCookie(cookieValue);
      return {
        uid: claims.uid,
        email: claims.email ?? null,
        emailVerified: claims.email_verified ?? false,
        name: (claims.name as string | undefined) || null,
        image: claims.picture ?? null,
      };
    } catch (error) {
      // Cookie vencida, de otro proyecto (`aud`) o alterada. Sin datos
      // personales: solo el código y el motivo de Firebase.
      const { code, message } = error as { code?: string; message?: string };
      console.warn("[auth] cookie de sesión rechazada:", code, message);
      return null;
    }
  },
};
