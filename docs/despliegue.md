# Despliegue en producción (Vercel)

Guía paso a paso para publicar `web` (la comunidad) y `admin` (el panel) en Vercel con un dominio en Cloudflare. Reemplaza `TU-DOMINIO` por el tuyo (por ejemplo `midominio.com`).

| App     | Proyecto de Vercel | URL de producción              |
| ------- | ------------------ | ------------------------------ |
| `web`   | `community`        | `https://community.TU-DOMINIO` |
| `admin` | `admin`            | `https://admin.TU-DOMINIO`     |

Producción usa **servicios propios**, separados de desarrollo y de las pruebas:

| Servicio | Desarrollo                                        | Pruebas (E2E)      | Producción             |
| -------- | ------------------------------------------------- | ------------------ | ---------------------- |
| Stream   | app de desarrollo                                 | app de pruebas     | **app de producción**  |
| Upstash  | base de desarrollo                                | (la de desarrollo) | **base de producción** |
| Google   | mismo cliente OAuth, con las URIs de cada entorno |                    |                        |

## 1. Preparar la app de Stream de producción

1. Crea la app en el dashboard de Stream (Activity Feeds, misma región que las otras).
2. En `apps/web/`, crea **temporalmente** `.env.stream-production.local` (git lo ignora):
   ```
   NEXT_PUBLIC_STREAM_API_KEY=<api key de producción>
   STREAM_API_SECRET=<secreto de producción>
   ```
3. Corre `pnpm --filter web stream:setup:prod`. Crea los grupos de feeds, los espacios, los permisos (comentar, editar y borrar solo por el servidor) y los posts de bienvenida. Es idempotente: si cambias permisos o espacios en el código, vuelve a correrlo.
4. Borra el archivo cuando termines: las credenciales de producción solo deben vivir en Vercel.

## 2. Google OAuth

En Google Cloud Console → **APIs y servicios → Credenciales** → tu cliente OAuth:

- **URI de redireccionamiento autorizados:** agrega
  - `https://community.TU-DOMINIO/api/auth/callback/google`
  - `https://admin.TU-DOMINIO/api/auth/callback/google`
- **Orígenes de JavaScript autorizados:** `https://community.TU-DOMINIO` y `https://admin.TU-DOMINIO`.

Y en **Pantalla de consentimiento de OAuth**: si el estado de publicación es **"Testing"**, solo pueden entrar los usuarios de prueba que agregues. Cámbialo a **"In production"** (Publicar app). Como solo pedimos email y perfil, Google no exige verificación.

## 3. Crear los proyectos en Vercel

Repite para cada app (`web` y `admin`):

1. Vercel → **Add New → Project** → importa el repo de GitHub.
2. **Project Name:** `community` (para `web`) o `admin`.
3. **Root Directory:** `apps/web` o `apps/admin`. Vercel detecta Next.js y Turborepo y configura el build solo.
4. Antes de desplegar, abre **Environment Variables** y carga las de la tabla de abajo, en el entorno **Production**.
5. **Deploy.**

Después, en **Settings** de cada proyecto:

- **Build and Deployment → Node.js Version:** 24.x (es el valor por defecto).
- **Build and Deployment → Ignored Build Step:** para no construir previews (no tienen login ni variables), usa el comando
  ```
  if [ "$VERCEL_ENV" = "production" ]; then exit 1; else exit 0; fi
  ```
  (código 1 = construir, 0 = saltar). Los PRs ya se validan en GitHub con CI y E2E.

### Variables de entorno (Production)

| Variable                       | `community` (web)                                        | `admin`                            |
| ------------------------------ | -------------------------------------------------------- | ---------------------------------- |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1`                                                      | `1`                                |
| `NEXT_PUBLIC_STREAM_API_KEY`   | app de Stream de **producción**                          | la misma                           |
| `STREAM_API_SECRET`            | app de Stream de **producción**                          | la misma                           |
| `GOOGLE_CLIENT_ID`             | tu cliente OAuth                                         | el mismo                           |
| `GOOGLE_CLIENT_SECRET`         | tu cliente OAuth                                         | el mismo                           |
| `BETTER_AUTH_SECRET`           | nuevo: `openssl rand -base64 32`                         | **otro** nuevo, distinto al de web |
| `BETTER_AUTH_URL`              | `https://community.TU-DOMINIO`                           | `https://admin.TU-DOMINIO`         |
| `ADMIN_EMAILS`                 | correos del equipo, separados por coma                   | los mismos                         |
| `UPSTASH_REDIS_REST_URL`       | base de Upstash de **producción**                        | — (no la usa)                      |
| `UPSTASH_REDIS_REST_TOKEN`     | base de Upstash de **producción**                        | —                                  |
| `NEXT_PUBLIC_SENTRY_DSN`       | DSN del proyecto de Sentry `community` (tipo **Config**) | DSN del proyecto `admin`           |
| `SENTRY_ORG`                   | slug de tu organización en Sentry                        | el mismo                           |
| `SENTRY_PROJECT`               | slug del proyecto `community`                            | slug del proyecto `admin`          |
| `SENTRY_AUTH_TOKEN`            | token de organización (source maps)                      | el mismo                           |

Sentry es opcional: sin `NEXT_PUBLIC_SENTRY_DSN` queda apagado, y sin `SENTRY_AUTH_TOKEN` el build no sube source maps (los errores llegan, pero con el código compilado). El DSN es público (lo usa el navegador); el token es secreto. Al cambiar el DSN, redespliega sin caché (es `NEXT_PUBLIC_`).

`ENABLE_EXPERIMENTAL_COREPACK=1` hace que Vercel use la versión exacta de pnpm del campo `packageManager` (pnpm 11); sin ella Vercel solo detecta hasta pnpm 10.

## 4. Dominios (Cloudflare)

1. En cada proyecto de Vercel → **Settings → Domains** → agrega `community.TU-DOMINIO` (proyecto `community`) y `admin.TU-DOMINIO` (proyecto `admin`). Vercel indica el registro a crear.
2. En Cloudflare → tu dominio → **DNS → Records**, crea dos registros:

   | Tipo  | Nombre      | Destino                | Proxy                    |
   | ----- | ----------- | ---------------------- | ------------------------ |
   | CNAME | `community` | `cname.vercel-dns.com` | **DNS only** (nube gris) |
   | CNAME | `admin`     | `cname.vercel-dns.com` | **DNS only** (nube gris) |

   Deben quedar en **DNS only**: con el proxy de Cloudflare (nube naranja) se pelean los certificados SSL de Vercel y de Cloudflare.

3. Espera a que Vercel marque los dominios como válidos (suele tardar de minutos a media hora). Vercel emite el certificado HTTPS solo.

## 5. Verificar

- [ ] `https://community.TU-DOMINIO` carga el inicio y "Acceder" lleva al login.
- [ ] El login con Google funciona y llega a `/feed` con los espacios y los posts de bienvenida.
- [ ] Publicar, comentar, dar like y la campana de notificaciones funcionan.
- [ ] `https://admin.TU-DOMINIO` → login con un correo de `ADMIN_EMAILS` → panel de moderación; con otro correo → "No tienes acceso".
- [ ] En el dashboard de Stream de producción aparecen los miembros y las publicaciones.
- [ ] En Vercel → **Logs** no hay errores.

## Después de cada cambio

- Cada merge a `main` despliega las dos apps automáticamente (Vercel salta la que no cambió si activas **Skip deployment** para proyectos no afectados en **Root Directory**).
- Si un cambio toca permisos, espacios o grupos de Stream, corre de nuevo `stream:setup:prod` (paso 1).
- Las variables nuevas se agregan en Vercel y en `turbo.json` (`tasks.build.env`).

## Problemas comunes

| Síntoma                                                                              | Causa                                                                                                                                      | Solución                                                                                                                                    |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| El navegador dice `DNS_PROBE_FINISHED_NXDOMAIN` aunque el CNAME ya existe            | Se abrió el subdominio **antes** de crear el registro y el DNS (del router o del equipo) guardó el "no existe" hasta 30 min                | Esperar, o usar el DNS seguro de Chrome / `1.1.1.1`. Para evitarlo: crear el CNAME **antes** de abrir el subdominio                         |
| "This page couldn't load" y en los logs `Stream error code 2: … "api_key not valid"` | En `NEXT_PUBLIC_STREAM_API_KEY` quedó otro valor: el **App ID** (solo números) en vez de la **Key**, comillas o espacios, o la de otra app | Copiar la **Key** de la app de producción y hacer **Redeploy sin "Use existing Build Cache"**: Next incrusta las `NEXT_PUBLIC_` en el build |
| En los logs `[Better Auth]: Invalid origin: https://…vercel.app`                     | Se entró por la URL del deploy (`*.vercel.app`) y no por el dominio                                                                        | Entrar siempre por `community.` / `admin.`; Better Auth solo acepta el origen de `BETTER_AUTH_URL`                                          |
| Google muestra "Acceso bloqueado: … usuarios de prueba"                              | La pantalla de consentimiento sigue en **Prueba**                                                                                          | Google Auth Platform → **Público** → **Publicar app**                                                                                       |
| Google muestra `redirect_uri_mismatch`                                               | Falta la URI del entorno en el cliente OAuth                                                                                               | Agregar `https://<subdominio>/api/auth/callback/google`                                                                                     |
