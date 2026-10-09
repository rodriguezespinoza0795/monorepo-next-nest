# getStream — Comunidad

Comunidad estilo Circle construida con **Next.js**, **Material UI** y **Stream Activity Feeds v3**, en un monorepo de Turborepo.

| Paquete              | Qué es                                                                                          | Puerto |
| -------------------- | ----------------------------------------------------------------------------------------------- | ------ |
| `apps/web`           | La comunidad: login con Google, espacios, publicaciones, comentarios, perfiles y notificaciones | 3000   |
| `apps/admin`         | Panel de moderación (solo administradores)                                                      | 3001   |
| `packages/ui`        | Tema y componentes compartidos (MUI)                                                            | —      |
| `packages/community` | Código de servidor compartido: cliente de Stream y regla de administradores                     | —      |

Las reglas de negocio (roles, permisos, límites y brechas conocidas) están en [`docs/reglas-de-negocio.md`](docs/reglas-de-negocio.md), y el plan en curso en [`docs/plan-v2.md`](docs/plan-v2.md).

## Requisitos

- Node.js 24 (`nvm use`) y pnpm 11
- Una app de **Stream** (Activity Feeds), un cliente **OAuth de Google** y una base de **Upstash Redis** (todos tienen plan gratis)

## Puesta en marcha

```sh
pnpm install

# Variables de entorno: copia los ejemplos y complétalos
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local

# Prepara la app de Stream (grupos de feeds, espacios y permisos). Idempotente.
pnpm --filter web stream:setup

pnpm dev   # web en http://localhost:3000 · admin en http://localhost:3001
```

En Google Cloud Console autoriza las URIs de redirección `http://localhost:3000/api/auth/callback/google` y `http://localhost:3001/api/auth/callback/google`.

## Calidad

```sh
pnpm check-types
pnpm lint
pnpm build
```

Se ejecutan en GitHub Actions en cada PR y en cada push a `main` (`.github/workflows/ci.yml`).

### Pruebas de punta a punta

Usan una **app de Stream solo para pruebas** (crean y borran miembros, publicaciones y comentarios, y las publicaciones cuentan para el tope mensual de actividades).

```sh
cp apps/web/.env.test.example apps/web/.env.test.local   # credenciales de la app de pruebas
pnpm --filter web exec playwright install chromium        # una vez
pnpm --filter web test:e2e
```

Playwright compila y levanta su propio servidor de `web` en el puerto 3100 (carpeta `.next-e2e`), así que no choca con `pnpm dev`. Las pruebas viven en `apps/web/e2e/`.

En GitHub se corren bajo demanda desde **Actions → E2E → Run workflow** (`.github/workflows/e2e.yml`), con los secrets `STREAM_TEST_API_KEY`, `STREAM_TEST_API_SECRET` y, opcionalmente, `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.

## Despliegue

`web` y `admin` se despliegan en Vercel, cada una como proyecto propio, con servicios de producción separados (Stream, Upstash). Guía paso a paso en [`docs/despliegue.md`](docs/despliegue.md).

### Validación en móvil

Todo cambio visual se valida también en móvil (ver `CLAUDE.md`):

```sh
~/.venvs/playwright/bin/python .claude/scripts/mobile_check.py <carpeta-de-capturas> [ruta]
```
