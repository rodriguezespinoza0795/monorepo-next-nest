import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Cookie de sesión compartida con la comunidad: la crea esta app y la leen
// `community.` y `admin.` (mismo nombre y dominio padre).
export const SESSION_COOKIE =
  process.env.SESSION_COOKIE_NAME || "davidre_session";
const SESSION_DAYS = 7;
const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;
// Solo se acepta un inicio de sesión reciente para crear la cookie (lo que
// recomienda Firebase): un ID token robado y viejo no sirve.
const RECENT_SIGN_IN_SECONDS = 5 * 60;

const adminAuth = () => {
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Sin comillas alrededor (si se copiaron de `.env.local`) y con los
        // `\n` escritos convertidos en saltos de línea.
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.trim()
          .replace(/^(["'])([\s\S]*)\1$/, "$2")
          .replace(/\\n/g, "\n"),
      }),
    });
  return getAuth(app);
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  domain: process.env.SESSION_COOKIE_DOMAIN || undefined,
};

export interface Session {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
}

// Sesión de la petición actual, o `null` si no hay cookie o no es válida.
export const getSession = cache(async (): Promise<Session | null> => {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    const claims = await adminAuth().verifySessionCookie(value);
    return {
      uid: claims.uid,
      email: claims.email ?? null,
      emailVerified: claims.email_verified ?? false,
      name: (claims.name as string | undefined) ?? null,
      image: claims.picture ?? null,
    };
  } catch {
    return null;
  }
});

// Cambia el ID token de Firebase (recién emitido en el navegador) por la
// cookie de sesión. Devuelve `false` si el token no es válido o no es reciente.
export const createSession = async (idToken: string) => {
  const auth = adminAuth();
  try {
    const { auth_time } = await auth.verifyIdToken(idToken);
    if (Date.now() / 1000 - auth_time > RECENT_SIGN_IN_SECONDS) return false;
    const value = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });
    (await cookies()).set(SESSION_COOKIE, value, {
      ...cookieOptions,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return true;
  } catch {
    return false;
  }
};

// Borra la cookie (con el mismo dominio con que se creó).
export const deleteSession = async () => {
  (await cookies()).set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
};
