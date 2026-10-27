import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { AuthAdapter } from "./types";

// App de Firebase Admin propia (con nombre), para no chocar con otra que
// inicialice la app que use este paquete.
const APP_NAME = "repo-auth";

const adminAuth = () => {
  const app =
    getApps().find((existing) => existing.name === APP_NAME) ??
    initializeApp(
      {
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
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
    try {
      const claims = await adminAuth().verifySessionCookie(cookieValue);
      return {
        uid: claims.uid,
        email: claims.email ?? null,
        emailVerified: claims.email_verified ?? false,
        name: (claims.name as string | undefined) || null,
        image: claims.picture ?? null,
      };
    } catch {
      return null;
    }
  },
};
