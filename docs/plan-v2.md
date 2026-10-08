# Plan v2 — Comunidad

Estado: **en curso** (empezado el 2026-10-08). Hecho: PR 1 (rama `feat/v2-server-validation`). Decisiones tomadas: Upstash Redis para el límite compartido; Fase A primero. El plan v1 (6 PRs: login, feed, publicar e interactuar, espacios y perfil, notificaciones y moderación) está completo.

Objetivo: dejar la comunidad lista para producción y acercarla más a Circle, manteniendo la arquitectura actual: Stream Activity Feeds v3 en el plan gratuito, Better Auth sin base de datos y sin servidores propios. Primero la calidad, después las funciones.

Las brechas citadas son las de [`reglas-de-negocio.md`](reglas-de-negocio.md#10-brechas-conocidas). Cada PR actualiza ese documento si cambia permisos, roles, pantallas o límites.

## Fase A — Listo para producción

| PR                                        | Contenido                                                                                                                                                                                                                                                                                                                                    | Cierra                      |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **1. Validaciones y límites en servidor** | Los comentarios pasan por una server action que valida largo, menciones (solo miembros que existen) y bloqueo, igual que `createPost`. Límite de frecuencia **compartido** entre instancias con Upstash Redis (plan gratis) para posts, comentarios y likes.                                                                                 | Brechas 3, 4, 5 y 8         |
| **2. Editar y borrar lo propio**          | El autor edita el texto de su post o comentario y los borra, siempre por el servidor con las mismas validaciones. Etiqueta "editado".                                                                                                                                                                                                        | Brecha 2                    |
| **3. Pruebas automáticas y CI**           | Pasar los scripts de Playwright usados en cada PR del v1 a una suite en el repo (helpers para crear sesiones, usuarios temporales y limpieza), contra una **app de Stream de pruebas** separada para no gastar las 5k actividades reales. GitHub Actions: `check-types`, `lint` y `build` en cada PR; pruebas de punta a punta bajo demanda. | Riesgo de regresiones       |
| **4. Despliegue**                         | `web` y `admin` en Vercel (plan gratis), dominio real en Google OAuth (URIs de redirección de ambas apps), apps de Stream separadas para desarrollo y producción, `stream:setup` contra producción, secretos y `BETTER_AUTH_URL` por app, monitoreo de errores con Sentry (plan gratis).                                                     | Configuración de producción |

## Fase B — Funciones tipo Circle

| PR                            | Contenido                                                                                                                                                | Cómo (sin base de datos)                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **5. Búsqueda**               | Buscar publicaciones y miembros desde el encabezado.                                                                                                     | `queryActivities` con filtro de texto (`$q`, ya probado en servidor) y `queryUsers`.                      |
| **6. Directorio de miembros** | Página `/feed/miembros` y la columna "Miembros" real en la barra derecha.                                                                                | `queryUsers`.                                                                                             |
| **7. Posts fijados**          | El admin fija un post arriba de un espacio ("Destacado").                                                                                                | `pinActivity` de Stream.                                                                                  |
| **8. Guardados**              | "Guardar" en cada post y página `/feed/guardados`.                                                                                                       | Bookmarks de Stream.                                                                                      |
| **9. Eventos**                | Espacio de eventos: el admin crea eventos (título, fecha, lugar o enlace), los miembros confirman asistencia; la barra "Próximos eventos" se llena sola. | El evento es una actividad con campos propios; "Asistiré" es una reacción. Cada evento gasta 1 actividad. |
| **10. Reportes de miembros**  | Botón "Reportar" en posts y comentarios, con una cola de reportes en el panel de `admin`. UI para restaurar comentarios eliminados.                      | API de moderación de Stream (flags); `restoreComment`.                                                    |

**Fuera del v2 (candidatos para un v3):** mensajes directos (es otro producto de Stream, Chat, con su propio plan y límites), encuestas y texto enriquecido con Tiptap.

## Decisiones pendientes (resolver al empezar)

1. **Hosting:** ¿Vercel u otro?
2. **Límite de frecuencia compartido:** ¿Upstash Redis (plan gratis) o dejarlo por proceso y documentarlo?
3. **App de Stream de pruebas:** crearla en el dashboard y pasar su API key y secreto para `.env` de pruebas.
4. **Orden:** recomendado empezar por la Fase A (PR 1 → 4) y luego la Fase B.

## Cosas a tener en cuenta (aprendidas en el v1)

- Solo las **publicaciones** cuentan para el tope de 5k actividades al mes (también los `upsert` y las que luego se borran); comentarios, reacciones y notificaciones no. Evitar crear posts de prueba en la app real.
- Los hooks de estado del SDK de Stream no se pueden renderizar en el servidor: envolver con `RequireFeedsClient`.
- Desde un componente de servidor no se puede pasar `Link` como prop a componentes de MUI (cliente): usar `href` directo o un wrapper de cliente.
- Stream deja a cualquier usuario **crear** un feed que no existe y quedar como dueño: crear feeds con `getOrCreateOwnedFeed`.
- Cada cambio visual se aplica en `web` y `admin` y se valida en móvil (ver `CLAUDE.md`).
