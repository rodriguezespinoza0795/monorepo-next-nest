# Plan versión 2 — Login compartido con la app principal

Estado: **terminado** (aprobado y desplegado el 2026-10-27; se etiqueta `v2.0.0` al mergear el PR 5). **PR 1 hecho** (#24, demo `apps/main`; proyecto de Firebase `davire-dev`). PR 2 (#25), PR 3 (#26) y PR 4 (#27) hechos y en producción desde el 2026-10-27, más los arreglos #28 (`jose` 5 para `firebase-admin` en Vercel) y #29 (diagnóstico de sesión y clave entre comillas); Stream de producción vaciado y recreado. PR 5: guía [`reutilizar-community.md`](reutilizar-community.md), README y problemas comunes de despliegue. Parte de la versión estable `v1.0.0` (PRs #1–#23, que incluye el plan v1 y las fases A y B de [`plan-v2.md`](plan-v2.md)). **Firebase en producción:** por ahora `davire-dev` (el mismo que en desarrollo, con `www.davidre.dev` autorizado); queda pendiente pasar a un proyecto propio de producción.

Objetivo: que community deje de tener login propio y sea reutilizable. La app principal vive en `www.davidre.dev` y tiene su propio login (Firebase); community (`community.davidre.dev`) se enfoca 100% en el feed y respeta ese login: quien ya inició sesión en la app principal entra directo a community y al panel `admin` (`admin.davidre.dev`). El login va detrás de un adaptador intercambiable, para poder conectar community a otra app principal en el futuro.

Cada PR actualiza [`reglas-de-negocio.md`](reglas-de-negocio.md) si cambia permisos, roles, pantallas o límites.

## Cómo funciona

1. El usuario inicia sesión en la app principal con Firebase (Google, correo y contraseña, o enlace mágico).
2. El servidor de la app principal cambia ese login por una _session cookie_ de Firebase en el dominio padre `.davidre.dev`.
3. Community y admin leen esa cookie, la verifican en su servidor con Firebase Admin y, con ella, entregan el token de Stream.
4. Sin sesión, community redirige a `www.davidre.dev/login?next=…` y, al terminar, el usuario vuelve a donde estaba (solo se aceptan destinos bajo `davidre.dev`).
5. Salir en cualquiera de las apps cierra la sesión en todas.

## PRs

| PR                                        | Contenido                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Demo de la app principal**           | App nueva `apps/main` (puerto 3002) con el mismo tema oscuro. Login con Firebase: Google, correo y contraseña (registro con nombre y recuperar contraseña) y enlace mágico. Una ruta del servidor crea y borra la session cookie; el dominio de la cookie se configura por variable. Inicio con "Hola, {nombre}" y botón "Ir a la comunidad".                                                                                                                                                            |
| **2. Community usa la sesión compartida** | Paquete nuevo `packages/auth` con el adaptador de Firebase; expone `getSession()`, que devuelve `{ id, email, name, image }`. `web` deja Better Auth: `/login` redirige a la app principal y se actualizan la ruta del token de Stream, el layout del feed, las acciones y "Salir". El id en Stream pasa a ser `f_<uid de Firebase>`. Sin nombre (enlace mágico), se usa la parte del correo antes de la @. Las pruebas E2E crean sesiones con Firebase Admin contra un proyecto de Firebase de pruebas. |
| **3. Admin usa la sesión compartida**     | Lo mismo en `admin`; la lista de correos de admins se mantiene. Se quita Better Auth del repo.                                                                                                                                                                                                                                                                                                                                                                                                           |
| **4. Empezar de cero y desplegar**        | Script para vaciar usuarios, posts y follows en Stream (confirmación explícita antes de correrlo en producción; no se puede deshacer). Luego `stream:setup`, `apps/main` en Vercel como `www.davidre.dev`, dominios autorizados en Firebase, variables nuevas y limpieza de los secretos de Google OAuth de Better Auth.                                                                                                                                                                                 |
| **5. Documentación para reutilizar**      | Actualizar `reglas-de-negocio.md` y `despliegue.md`, más una guía "cómo conectar community a otra app principal" (qué cookie espera, qué variables configurar y cómo escribir otro adaptador).                                                                                                                                                                                                                                                                                                           |

## Decisiones tomadas (2026-10-27)

1. **Dominio:** todo bajo `davidre.dev` (`www.`, `community.` y `admin.`).
2. **Demo de la app principal:** dentro de este monorepo (`apps/main`); en producción, su propio proyecto en Vercel.
3. **Usuarios actuales:** se empieza de cero; los ids nuevos salen del uid de Firebase y se vacían los datos de Stream.
4. **Admin:** usa el mismo login que community; Better Auth desaparece del todo.

## Antes del PR 1

- Proyecto de Firebase (plan gratuito Spark) con tres métodos de acceso activados: Google, Correo/contraseña y Enlace por correo. Más adelante, un segundo proyecto para las pruebas.
- Credenciales: configuración web (`apiKey`, `authDomain`, `projectId`…) y una cuenta de servicio para Firebase Admin.

## Cosas a tener en cuenta

- Compartir la cookie exige que todo viva bajo `davidre.dev`. Una app principal en otro dominio necesitaría un intercambio por redirección; queda fuera de la versión 2.
- En local funciona sin configurar nada: las cookies de `localhost` se comparten entre puertos (main :3002, web :3000, admin :3001).
- En el plan gratuito de Firebase (Spark) solo se envían **5 correos de enlace mágico al día** (verificado el 2026-10-27 en [los límites de Firebase Auth](https://firebase.google.com/docs/auth/limits)); para más hay que pasar a Blaze. Alcanza para la demo; con usuarios reales, Google y contraseña son los métodos principales.
- Las cuentas con contraseña llegan **sin verificar** hasta que abren el correo de verificación; un correo sin verificar nunca debe dar permisos de admin (PR 3).
- La session cookie de Firebase dura como máximo 14 días.
- Solo las publicaciones cuentan para el tope de 5k actividades al mes de Stream; los posts de bienvenida de `stream:setup` tras vaciar los datos sí cuentan.
