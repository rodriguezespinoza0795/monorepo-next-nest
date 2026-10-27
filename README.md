# getStream — Comunidad

Comunidad estilo Circle construida con **Next.js**, **Material UI** y **Stream Activity Feeds v3**, en un monorepo de Turborepo.

| Paquete              | Qué es                                                                                | Puerto |
| -------------------- | ------------------------------------------------------------------------------------- | ------ |
| `apps/web`           | La comunidad: espacios, publicaciones, comentarios, perfiles y notificaciones         | 3000   |
| `apps/admin`         | Panel de moderación (solo administradores)                                            | 3001   |
| `apps/main`          | Demo de la app principal: login con Firebase (Google, contraseña, enlace mágico)      | 3002   |
| `packages/ui`        | Tema y componentes compartidos (MUI)                                                  | —      |
| `packages/auth`      | Verifica la sesión de la app principal (adaptador de Firebase)                        | —      |
| `packages/community` | Código de servidor compartido: cliente de Stream, miembros y regla de administradores | —      |

La comunidad y el panel no tienen login propio: usan la sesión de la app principal (una cookie en el dominio padre). Para conectarlas a otra app principal, ver [`docs/reutilizar-community.md`](docs/reutilizar-community.md).

Las reglas de negocio (roles, permisos, límites y brechas conocidas) están en [`docs/reglas-de-negocio.md`](docs/reglas-de-negocio.md), y el plan de la versión 2 en [`docs/plan-version-2.md`](docs/plan-version-2.md).

## Requisitos

- Node.js 24 (`nvm use`) y pnpm 11
- Una app de **Stream** (Activity Feeds), un proyecto de **Firebase** (Authentication con Google, correo/contraseña y enlace por correo) y una base de **Upstash Redis** (todos tienen plan gratis)

## Puesta en marcha

```sh
pnpm install

# Variables de entorno: copia los ejemplos y complétalos
cp apps/main/.env.example apps/main/.env.local
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local

# Prepara la app de Stream (grupos de feeds, espacios y permisos). Idempotente.
pnpm --filter web stream:setup

pnpm dev   # web :3000 · admin :3001 · main :3002
```

Las tres apps usan el **mismo** proyecto de Firebase: `main` necesita su configuración web (`NEXT_PUBLIC_FIREBASE_*`) y las tres la cuenta de servicio (`FIREBASE_*`). En local no hace falta dominio: las cookies de `localhost` se comparten entre puertos, así que al iniciar sesión en `main` ya entras a `web` y `admin`.

## Calidad

```sh
pnpm check-types
pnpm lint
pnpm build
```

Se ejecutan en GitHub Actions en cada PR y en cada push a `main` (`.github/workflows/ci.yml`).

### Pruebas de punta a punta

Usan una **app de Stream** y un **proyecto de Firebase** solo para pruebas (crean y borran miembros, publicaciones y comentarios, y las publicaciones cuentan para el tope mensual de actividades). Las sesiones de los miembros de prueba se crean con tokens propios de Firebase, sin pasar por `main`.

```sh
cp apps/web/.env.test.example apps/web/.env.test.local   # credenciales de Stream y Firebase de pruebas
pnpm --filter web exec playwright install chromium        # una vez
pnpm --filter web test:e2e
```

Playwright compila y levanta su propio servidor de `web` en el puerto 3100 (carpeta `.next-e2e`), así que no choca con `pnpm dev`. Las pruebas viven en `apps/web/e2e/`.

En GitHub corren en cada PR a `main` y bajo demanda desde **Actions → E2E → Run workflow** (`.github/workflows/e2e.yml`), con los secrets `STREAM_TEST_API_KEY`, `STREAM_TEST_API_SECRET`, `FIREBASE_TEST_PROJECT_ID`, `FIREBASE_TEST_CLIENT_EMAIL`, `FIREBASE_TEST_PRIVATE_KEY`, `FIREBASE_TEST_API_KEY` y, opcionalmente, `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.

## Despliegue

`main` (`www.`), `web` (`community.`) y `admin` (`admin.`) se despliegan en Vercel, cada una como proyecto propio y bajo el mismo dominio, con servicios de producción separados (Stream, Upstash, Firebase). Guía paso a paso en [`docs/despliegue.md`](docs/despliegue.md).

### Validación en móvil

Todo cambio visual se valida también en móvil (ver `CLAUDE.md`):

```sh
~/.venvs/playwright/bin/python .claude/scripts/mobile_check.py <carpeta-de-capturas> [ruta] [--apps=web,admin,main]
```
