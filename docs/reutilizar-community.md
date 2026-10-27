# Conectar la comunidad a otra app principal

La comunidad (`apps/web`) y el panel (`apps/admin`) **no tienen login propio**: confían en la sesión de una app principal. Hoy esa app es la demo `apps/main` (Firebase), pero se puede conectar cualquier otra que cumpla el contrato de abajo. Esta guía explica qué espera la comunidad y cómo conectarla.

## El contrato

La app principal tiene que dar tres cosas:

1. **Una cookie de sesión que la comunidad pueda leer.** Se crea en el **dominio padre** (`Domain=.tu-dominio.com`), `HttpOnly`, `Secure`, `SameSite=Lax` y `Path=/`, con el nombre `davidre_session` (configurable con `SESSION_COOKIE_NAME` en las tres apps). Por eso la app principal, la comunidad y el panel tienen que vivir **bajo el mismo dominio** (`www.`, `community.`, `admin.`).
2. **Una página de login que acepte `?next=<URL absoluta>`** y, al terminar, vuelva a esa URL. Debe aceptar solo hosts propios (la comunidad y el panel), para no servir de redirección a sitios ajenos.
3. **Un adaptador en `packages/auth`** que sepa verificar esa cookie en el servidor y devolver el usuario (ver abajo). Con Firebase ya existe (`firebaseAdapter`).

Lo que hace la comunidad con eso:

| Momento                        | Qué pasa                                                                                                                                           | Dónde                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Entra sin cookie a `/feed/...` | `proxy.ts` manda a `/login?next=/feed/...`, que redirige a `AUTH_LOGIN_URL?next=<APP_URL>/feed/...`                                                | `apps/web/proxy.ts`, `apps/web/app/login`   |
| Entra con cookie               | El servidor la verifica con el adaptador y la traduce a miembro: id en Stream, nombre, foto y si es admin                                          | `@repo/auth/session`, `memberFromAuthUser`  |
| Primera visita al feed         | Se crea el miembro en Stream (perfil, feeds) y se une a los espacios                                                                               | `apps/web/lib/onboarding.ts`                |
| Cookie presente pero no válida | Muestra "No pudimos validar tu sesión" (no redirige: si la app principal sí la acepta, sería un bucle) y deja en los logs `[auth] …` con el motivo | `apps/web/app/login`, `packages/auth`       |
| Cierra sesión                  | Borra la cookie (mismo nombre y `SESSION_COOKIE_DOMAIN`): se cierra en las tres apps                                                               | `app/session-actions.ts` de `web` y `admin` |
| Panel de moderación            | Igual que la comunidad; solo entra quien tiene el correo en `ADMIN_EMAILS` **y verificado**                                                        | `apps/admin/lib/session.ts`                 |

La app principal no necesita saber nada de Stream: la comunidad crea a sus miembros sola.

## Variables de la comunidad y el panel

| Variable                                                               | Para qué                                                                                             | Ejemplo                            |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `SESSION_COOKIE_NAME`                                                  | Nombre de la cookie (opcional; por defecto `davidre_session`)                                        | `davidre_session`                  |
| `SESSION_COOKIE_DOMAIN`                                                | Dominio de la cookie, para poder borrarla al cerrar sesión (vacío en local)                          | `.tu-dominio.com`                  |
| `AUTH_LOGIN_URL`                                                       | Página de login de la app principal                                                                  | `https://www.tu-dominio.com/login` |
| `APP_URL`                                                              | URL pública de esta app (para el `next` absoluto)                                                    | `https://community.tu-dominio.com` |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Solo con el adaptador de Firebase: la cuenta de servicio del **mismo** proyecto que la app principal | —                                  |

En local no hace falta dominio: las cookies de `localhost` se comparten entre puertos (`main` :3002, `web` :3000, `admin` :3001).

## Caso 1: la app principal usa Firebase

No hay que tocar la comunidad: basta con que la app principal cree la cookie como lo hace `apps/main`.

1. En el navegador, inicia sesión con el SDK de Firebase sin guardar nada (`inMemoryPersistence`) y obtiene el ID token (`user.getIdToken()`).
2. Lo manda a una ruta propia del servidor (en la demo, `POST /api/session`), que:
   - verifica el token y que el inicio de sesión sea reciente (`auth_time` de menos de 5 minutos),
   - lo cambia por una cookie de sesión con `createSessionCookie` (máximo 14 días; la demo usa 7),
   - la guarda con el nombre y el dominio del contrato.
3. Al cerrar sesión, borra la cookie con el mismo dominio.
4. Su login acepta `?next=` solo hacia los hosts permitidos (en la demo, `ALLOWED_REDIRECT_HOSTS`).

Referencia: `apps/main/lib/session.ts`, `apps/main/app/api/session/route.ts`, `apps/main/lib/redirect.ts` y `apps/main/lib/start-session.ts`.

Dos detalles de Firebase que conviene respetar:

- **Correo verificado.** Las cuentas con contraseña llegan sin verificar hasta que abren el correo de verificación. La comunidad nunca da permisos de admin a un correo sin verificar, así que la app principal debería enviar ese correo al registrar (la demo lo hace).
- **El nombre.** La comunidad toma `name` y `picture` de la sesión. Quien entra con enlace mágico no tiene nombre: se usa la parte del correo antes de la @. Si la app principal pide el nombre al registrar, que lo guarde en el perfil (`updateProfile`) **antes** de pedir el ID token (o que lo renueve con `getIdToken(true)`).

## Caso 2: otro proveedor de login

Se escribe un adaptador nuevo en `packages/auth`. La comunidad y el panel no cambian.

1. Crea `packages/auth/src/<proveedor>.ts` con un objeto que cumpla `AuthAdapter` (`packages/auth/src/types.ts`):

   ```ts
   import "server-only";
   import type { AuthAdapter } from "./types";

   export const miProveedorAdapter: AuthAdapter = {
     verifySession: async (cookieValue) => {
       try {
         // Verifica la cookie con lo que ofrezca el proveedor (JWT firmado,
         // endpoint de sesión, etc.). Nunca confíes en datos sin verificar.
         const claims = await verificar(cookieValue);
         return {
           uid: claims.sub, // estable: nunca cambia para la misma persona
           email: claims.email ?? null,
           emailVerified: claims.email_verified === true,
           name: claims.name ?? null,
           image: claims.picture ?? null,
         };
       } catch (error) {
         console.warn("[auth] cookie de sesión rechazada:", error);
         return null;
       }
     },
   };
   ```

2. En `packages/auth/src/session.ts`, cambia el adaptador activo:

   ```ts
   const adapter: AuthAdapter = miProveedorAdapter;
   ```

3. Si el adaptador necesita variables propias, agrégalas a los `.env.example` de `web` y `admin`, a `turbo.json` (`tasks.build.env`) y a Vercel.

Qué tiene que garantizar el adaptador:

- **`uid` estable.** De él sale el id del miembro en Stream (`streamUserId`, en `packages/community/src/users.ts`). Si cambia, la comunidad lo trata como otra persona.
- **`emailVerified` honesto.** Es lo que protege los permisos de admin.
- **Devolver `null` ante cualquier duda** (cookie vencida, firma inválida, configuración rota), sin lanzar: la comunidad lo muestra como "sin sesión".

### Cambiar de proveedor con miembros existentes

El id en Stream es `f_<uid>` (el prefijo `f_` es de Firebase). Con otro proveedor los `uid` son otros, así que los miembros actuales quedarían huérfanos. Hay dos caminos:

- **Empezar de cero**, como se hizo al pasar a la versión 2: `stream:reset` y `stream:setup` (ver [`despliegue.md`](despliegue.md#1-preparar-la-app-de-stream-de-producción)).
- **Conservarlos**: cambiar el prefijo en `streamUserId` para el proveedor nuevo y migrar con un script propio (Stream no permite renombrar usuarios: hay que crearlos de nuevo y mover su contenido).

## Lo que queda fuera

- **Otro dominio.** Si la app principal no comparte dominio con la comunidad, la cookie no llega. Haría falta un intercambio por redirección (la app principal devuelve un token de un solo uso que la comunidad cambia por su propia cookie). No está implementado.
- **Revocar sesiones al instante.** La cookie se verifica con las claves públicas del proveedor, sin consultar si se revocó; una sesión robada sirve hasta que vence. Con Firebase se puede activar `checkRevoked` en `verifySessionCookie`, a cambio de una llamada a Firebase por petición.

## Verificar una integración nueva

- [ ] Sin sesión, `community.…/feed/general` lleva al login de la app principal y, al entrar, vuelve a `/feed/general`.
- [ ] Con sesión iniciada en la app principal, la comunidad y el panel entran directo.
- [ ] Un correo de `ADMIN_EMAILS` sin verificar no entra al panel ni puede destacar publicaciones.
- [ ] Cerrar sesión en cualquiera de las apps la cierra en todas.
- [ ] Una cookie alterada muestra "No pudimos validar tu sesión" y deja `[auth] …` en los logs.
- [ ] Las pruebas E2E de `apps/web` pasan (crean sus sesiones con el adaptador activo; con otro proveedor hay que adaptar `loginAs` en `apps/web/e2e/support/members.ts`).
