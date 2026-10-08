import "server-only";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

// Login del panel: mismo Google que `web`, sesiones sin base de datos en
// cookies cifradas. Las cookies llevan el prefijo `admin` porque las dos apps
// comparten `localhost` (las cookies no distinguen puertos) y si no, una
// sesión pisaría a la otra. El acceso al panel lo decide `isAdmin`.
export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Siempre deja elegir cuenta: si entraste con una cuenta sin permisos,
      // puedes cambiar a la de administrador.
      prompt: "select_account",
      // Mismo id en Stream que en `web`: queda como autor de los baneos.
      mapProfileToUser: (profile) => ({ streamId: `g_${profile.sub}` }),
    },
  },
  user: {
    additionalFields: {
      streamId: { type: "string", required: true },
    },
  },
  databaseHooks: {
    user: {
      update: {
        // Igual que en `web`: `streamId` no se acepta en actualizaciones.
        before: async (user) => {
          if ("streamId" in user) {
            throw new APIError("BAD_REQUEST", {
              message: "streamId no se puede modificar",
            });
          }
        },
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60,
      strategy: "jwe",
      refreshCache: true,
    },
  },
  account: {
    storeStateStrategy: "cookie",
    storeAccountCookie: true,
  },
  advanced: { cookiePrefix: "admin" },
  plugins: [nextCookies()],
});
