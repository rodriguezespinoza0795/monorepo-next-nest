# Despliegue en producción (Vercel)

Guía paso a paso para publicar las tres apps en Vercel con un dominio en Cloudflare. Reemplaza `TU-DOMINIO` por el tuyo (por ejemplo `midominio.com`).

| App     | Qué es                                   | Proyecto de Vercel | URL de producción              |
| ------- | ---------------------------------------- | ------------------ | ------------------------------ |
| `main`  | App principal (demo): login con Firebase | `main`             | `https://www.TU-DOMINIO`       |
| `web`   | La comunidad                             | `community`        | `https://community.TU-DOMINIO` |
| `admin` | El panel de moderación                   | `admin`            | `https://admin.TU-DOMINIO`     |

El login vive solo en `main`: crea una cookie de sesión de Firebase en el dominio padre (`.TU-DOMINIO`) y `web` y `admin` la leen. Por eso **las tres apps tienen que vivir bajo el mismo dominio**.

Producción usa **servicios propios**, separados de desarrollo y de las pruebas:

| Servicio | Desarrollo             | Pruebas (E2E)       | Producción                 |
| -------- | ---------------------- | ------------------- | -------------------------- |
| Stream   | app de desarrollo      | app de pruebas      | **app de producción**      |
| Upstash  | base de desarrollo     | (la de desarrollo)  | **base de producción**     |
| Firebase | proyecto de desarrollo | proyecto de pruebas | **proyecto de producción** |

## 1. Preparar la app de Stream de producción

1. Si es la primera vez, crea la app en el dashboard de Stream (Activity Feeds, misma región que las otras).
2. En `apps/web/`, crea **temporalmente** `.env.stream-production.local` (git lo ignora):
   ```
   NEXT_PUBLIC_STREAM_API_KEY=<api key de producción>
   STREAM_API_SECRET=<secreto de producción>
   ```
3. Corre `pnpm --filter web stream:setup:prod`. Crea los grupos de feeds, los espacios, los permisos (comentar, editar y borrar solo por el servidor) y los posts de bienvenida. Es idempotente: si cambias permisos o espacios en el código, vuelve a correrlo.
4. Borra el archivo cuando termines: las credenciales de producción solo deben vivir en Vercel.

Para **empezar de cero** (borrar todos los miembros y publicaciones; se hizo al pasar a la versión 2), antes del paso 3:

```sh
pnpm --filter web stream:reset:prod                # solo cuenta lo que borraría
pnpm --filter web stream:reset:prod -- --confirm   # borra (no se puede deshacer)
```

Deja los grupos de feeds, los espacios y el usuario `system`; `stream:setup:prod` vuelve a crear los posts de bienvenida (2 actividades del tope mensual).

## 2. Firebase (login de `main`)

1. En el proyecto de producción, **Authentication → Sign-in method**: activa **Google**, **Correo electrónico/contraseña** y **Vínculo de correo electrónico (acceso sin contraseña)**.
2. **Authentication → Settings → Dominios autorizados:** agrega `www.TU-DOMINIO`. Sin él fallan Google (ventana emergente) y el enlace mágico (`auth/unauthorized-continue-uri`). Solo `main` usa Firebase en el navegador; `community.` y `admin.` no hace falta agregarlos.
3. **Configuración del proyecto → General → Tus apps:** la configuración web (`apiKey`, `authDomain`, `projectId`, `appId`) va en las variables `NEXT_PUBLIC_FIREBASE_*` de `main`.
4. **Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada:** `project_id`, `client_email` y `private_key` del JSON van en `FIREBASE_*` de **las tres apps** (`main` crea la cookie; `web` y `admin` la verifican). Pega la clave tal cual, con sus saltos de línea.

En el plan gratuito (Spark), Firebase envía solo **5 correos de enlace mágico al día**; para más hay que pasar a Blaze ([límites](https://firebase.google.com/docs/auth/limits)).

## 3. Crear los proyectos en Vercel

Repite para cada app (`main`, `web` y `admin`) que todavía no tenga proyecto:

1. Vercel → **Add New → Project** → importa el repo de GitHub.
2. **Project Name:** `main`, `community` (para `web`) o `admin`.
3. **Root Directory:** `apps/main`, `apps/web` o `apps/admin`. Vercel detecta Next.js y Turborepo y configura el build solo.
4. Antes de desplegar, abre **Environment Variables** y carga las de la tabla de abajo, en el entorno **Production**.
5. **Deploy.**

Después, en **Settings** de cada proyecto:

- **Build and Deployment → Node.js Version:** 24.x. Cada app lo pide en su `package.json` (`engines`), pero confírmalo: con una versión vieja, `firebase-admin` falla al cargar con `ERR_REQUIRE_ESM` (`jose`).
- **Build and Deployment → Ignored Build Step:** para no construir previews (no tienen login ni variables), usa el comando
  ```
  if [ "$VERCEL_ENV" = "production" ]; then exit 1; else exit 0; fi
  ```
  (código 1 = construir, 0 = saltar). Los PRs ya se validan en GitHub con CI y E2E.

### Variables de entorno (Production)

| Variable                           | `main`                                  | `community` (web)                                        | `admin`                    |
| ---------------------------------- | --------------------------------------- | -------------------------------------------------------- | -------------------------- |
| `ENABLE_EXPERIMENTAL_COREPACK`     | `1`                                     | `1`                                                      | `1`                        |
| `NEXT_PUBLIC_FIREBASE_API_KEY`     | config web de Firebase                  | —                                                        | —                          |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | config web de Firebase                  | —                                                        | —                          |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`  | config web de Firebase                  | —                                                        | —                          |
| `NEXT_PUBLIC_FIREBASE_APP_ID`      | config web de Firebase                  | —                                                        | —                          |
| `FIREBASE_PROJECT_ID`              | cuenta de servicio                      | la misma                                                 | la misma                   |
| `FIREBASE_CLIENT_EMAIL`            | cuenta de servicio                      | la misma                                                 | la misma                   |
| `FIREBASE_PRIVATE_KEY`             | cuenta de servicio                      | la misma                                                 | la misma                   |
| `SESSION_COOKIE_DOMAIN`            | `.TU-DOMINIO`                           | `.TU-DOMINIO`                                            | `.TU-DOMINIO`              |
| `ALLOWED_REDIRECT_HOSTS`           | `community.TU-DOMINIO,admin.TU-DOMINIO` | —                                                        | —                          |
| `NEXT_PUBLIC_COMMUNITY_URL`        | `https://community.TU-DOMINIO`          | —                                                        | —                          |
| `AUTH_LOGIN_URL`                   | —                                       | `https://www.TU-DOMINIO/login`                           | la misma                   |
| `APP_URL`                          | —                                       | `https://community.TU-DOMINIO`                           | `https://admin.TU-DOMINIO` |
| `NEXT_PUBLIC_STREAM_API_KEY`       | —                                       | app de Stream de **producción**                          | la misma                   |
| `STREAM_API_SECRET`                | —                                       | app de Stream de **producción**                          | la misma                   |
| `ADMIN_EMAILS`                     | —                                       | correos del equipo, separados por coma                   | los mismos                 |
| `UPSTASH_REDIS_REST_URL`           | —                                       | base de Upstash de **producción**                        | —                          |
| `UPSTASH_REDIS_REST_TOKEN`         | —                                       | base de Upstash de **producción**                        | —                          |
| `NEXT_PUBLIC_SENTRY_DSN`           | —                                       | DSN del proyecto de Sentry `community` (tipo **Config**) | DSN del proyecto `admin`   |
| `SENTRY_ORG`                       | —                                       | slug de tu organización en Sentry                        | el mismo                   |
| `SENTRY_PROJECT`                   | —                                       | slug del proyecto `community`                            | slug del proyecto `admin`  |
| `SENTRY_AUTH_TOKEN`                | —                                       | token de organización (source maps)                      | el mismo                   |

Los `FIREBASE_*` y `SESSION_COOKIE_DOMAIN` tienen que ser **iguales en las tres apps**: si `web` o `admin` verifican con otro proyecto, la sesión no les sirve (ver problemas comunes). `ADMIN_EMAILS` solo cuenta con el correo **verificado** (Google y enlace mágico lo están; con contraseña, al abrir el correo de verificación).

Sentry es opcional: sin `NEXT_PUBLIC_SENTRY_DSN` queda apagado, y sin `SENTRY_AUTH_TOKEN` el build no sube source maps (los errores llegan, pero con el código compilado). El DSN es público (lo usa el navegador); el token es secreto. Al cambiar el DSN o cualquier `NEXT_PUBLIC_`, redespliega sin caché.

`ENABLE_EXPERIMENTAL_COREPACK=1` hace que Vercel use la versión exacta de pnpm del campo `packageManager` (pnpm 11); sin ella Vercel solo detecta hasta pnpm 10.

## 4. Dominios (Cloudflare)

1. En cada proyecto de Vercel → **Settings → Domains** → agrega `www.TU-DOMINIO` (proyecto `main`), `community.TU-DOMINIO` (proyecto `community`) y `admin.TU-DOMINIO` (proyecto `admin`). Vercel indica el registro a crear.
2. En Cloudflare → tu dominio → **DNS → Records**, crea un registro por app:

   | Tipo  | Nombre      | Destino                | Proxy                    |
   | ----- | ----------- | ---------------------- | ------------------------ |
   | CNAME | `www`       | `cname.vercel-dns.com` | **DNS only** (nube gris) |
   | CNAME | `community` | `cname.vercel-dns.com` | **DNS only** (nube gris) |
   | CNAME | `admin`     | `cname.vercel-dns.com` | **DNS only** (nube gris) |

   Deben quedar en **DNS only**: con el proxy de Cloudflare (nube naranja) se pelean los certificados SSL de Vercel y de Cloudflare. Crea el CNAME **antes** de abrir el subdominio en el navegador (ver problemas comunes).

3. Espera a que Vercel marque los dominios como válidos (suele tardar de minutos a media hora). Vercel emite el certificado HTTPS solo.

## 5. Verificar

- [ ] `https://www.TU-DOMINIO` carga y permite entrar con Google, con correo y contraseña y con enlace mágico.
- [ ] `https://community.TU-DOMINIO/feed` sin sesión lleva al login de `www.` y, al entrar, vuelve al feed con los espacios y los posts de bienvenida.
- [ ] Con sesión iniciada en `www.`, la comunidad entra directo (sin volver a iniciar sesión).
- [ ] Publicar, comentar, dar like y la campana de notificaciones funcionan.
- [ ] `https://admin.TU-DOMINIO` con un correo de `ADMIN_EMAILS` (verificado) → panel de moderación; con otro correo → "No tienes acceso".
- [ ] "Cerrar sesión" en cualquiera de las tres apps cierra la sesión en las tres.
- [ ] En el dashboard de Stream de producción aparecen los miembros (`f_…`) y las publicaciones.
- [ ] En Vercel → **Logs** no hay errores.

## Después de cada cambio

- Cada merge a `main` despliega las apps afectadas automáticamente (Vercel salta las que no cambiaron con **Skip deployment** para proyectos no afectados en **Root Directory**).
- Si un cambio toca permisos, espacios o grupos de Stream, corre de nuevo `stream:setup:prod` (paso 1).
- Las variables nuevas se agregan en Vercel y en `turbo.json` (`tasks.build.env`).
- Un cambio que necesite variables nuevas en producción se mergea **después** de cargarlas en Vercel: el merge despliega solo.

## Problemas comunes

| Síntoma                                                                                       | Causa                                                                                                                                      | Solución                                                                                                                                    |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| El navegador dice `DNS_PROBE_FINISHED_NXDOMAIN` aunque el CNAME ya existe                     | Se abrió el subdominio **antes** de crear el registro y el DNS (del router o del equipo) guardó el "no existe" hasta 30 min                | Esperar, o usar el DNS seguro de Chrome / `1.1.1.1`. Para evitarlo: crear el CNAME **antes** de abrir el subdominio                         |
| "This page couldn't load" y en los logs `Stream error code 2: … "api_key not valid"`          | En `NEXT_PUBLIC_STREAM_API_KEY` quedó otro valor: el **App ID** (solo números) en vez de la **Key**, comillas o espacios, o la de otra app | Copiar la **Key** de la app de producción y hacer **Redeploy sin "Use existing Build Cache"**: Next incrusta las `NEXT_PUBLIC_` en el build |
| La comunidad o el panel muestran "No pudimos validar tu sesión"                               | Hay cookie pero esa app no la acepta: sus `FIREBASE_*` son de otro proyecto que los de `main`, o la clave privada quedó mal pegada         | Copiar las mismas `FIREBASE_*` en las tres apps y redesplegar                                                                               |
| Después de iniciar sesión en `www.` no vuelve a la comunidad (se queda en `www.`)             | Falta el host en `ALLOWED_REDIRECT_HOSTS` de `main`                                                                                        | Agregar `community.TU-DOMINIO,admin.TU-DOMINIO`                                                                                             |
| La comunidad vuelve a pedir login aunque ya entraste en `www.`                                | La cookie se creó solo para `www.`: `SESSION_COOKIE_DOMAIN` de `main` está vacío o mal escrito                                             | `SESSION_COOKIE_DOMAIN=.TU-DOMINIO` en las tres apps; volver a iniciar sesión                                                               |
| "Cerrar sesión" en la comunidad no cierra la sesión en `www.`                                 | `SESSION_COOKIE_DOMAIN` distinto en `web`/`admin` que en `main` (borra otra cookie)                                                        | El mismo valor en las tres                                                                                                                  |
| Google o el enlace mágico fallan con `auth/unauthorized-domain` o `unauthorized-continue-uri` | Falta `www.TU-DOMINIO` en los dominios autorizados de Firebase                                                                             | Firebase → Authentication → Settings → Dominios autorizados                                                                                 |
| "Se alcanzó el límite de correos por hoy" al pedir el enlace mágico                           | Plan Spark: 5 correos de enlace mágico al día                                                                                              | Usar Google o contraseña, o pasar el proyecto a Blaze                                                                                       |
