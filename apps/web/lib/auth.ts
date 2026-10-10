import "server-only";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { onboardStreamUser } from "./onboarding";
import { reportError } from "./report-error";

// Sesiones sin base de datos: la sesión y la cuenta viven en cookies cifradas.
// El `id` que genera Better Auth sin base de datos no es estable entre
// reinicios, así que la identidad en Stream usa el `sub` de Google (`streamId`).
export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      mapProfileToUser: (profile) => ({ streamId: `g_${profile.sub}` }),
    },
  },
  user: {
    additionalFields: {
      // `input: false` haría que Better Auth descarte el valor de
      // `mapProfileToUser`, así que el campo se protege con el hook de abajo.
      streamId: { type: "string", required: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Sin base de datos el usuario se "crea" en cada inicio de sesión tras
        // un reinicio del servidor; el onboarding es idempotente. Si Stream
        // falla no se bloquea el login: el feed se verá vacío hasta el
        // siguiente inicio de sesión.
        after: async (user) => {
          try {
            await onboardStreamUser({
              id: user.streamId as string,
              name: user.name,
              image: user.image,
            });
          } catch (error) {
            reportError("[stream] onboarding falló", error);
          }
        },
      },
      update: {
        // `streamId` solo se asigna al crear el usuario desde Google. Una
        // actualización que lo incluya (por ejemplo, vía `/update-user`) se
        // rechaza: devolver `false` no basta, porque sin base de datos el
        // endpoint reescribe igual la cookie de sesión con el valor enviado.
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
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
