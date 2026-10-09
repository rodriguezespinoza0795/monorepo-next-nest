# Reglas de negocio — Comunidad

Fuente de verdad sobre **quién puede hacer qué** en la comunidad (`apps/web`) y su moderación (`apps/admin`). Todo cambio que agregue o modifique un permiso, un rol, una pantalla o un límite **actualiza este documento en el mismo PR**.

Las reglas marcadas como verificadas se probaron contra Stream con un usuario temporal (2026-10-08).

Leyenda: ✅ permitido · ❌ no permitido · ⏳ pendiente (se indica el PR del plan) · — no aplica

## 1. Roles

| Rol                   | Quién es                                                                          | Cómo se determina                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Visitante**         | Persona sin sesión                                                                | No hay cookie de sesión válida                                                                                                 |
| **Miembro**           | Cualquier persona que inició sesión con Google                                    | Sesión de Better Auth; en Stream es un usuario con rol `user` e id `g_<sub de Google>`                                         |
| **Autor (owner)**     | El miembro que creó un post, comentario o reacción, **respecto de ese contenido** | `activity.user.id` / `comment.user.id` es su `streamId`                                                                        |
| **Administrador**     | Miembro del equipo                                                                | Su correo está en `ADMIN_EMAILS`. Es un rol **de la app**: en Stream sigue siendo `user` (ver [brechas](#7-brechas-conocidas)) |
| **Sistema**           | Usuario técnico `system` ("Equipo getStream")                                     | Dueño de los espacios y autor de los posts de bienvenida; solo lo usa el servidor                                              |
| **Miembro bloqueado** | Miembro bloqueado desde el panel de moderación                                    | Baneo de Stream (`user.banned`)                                                                                                |

Un administrador también es miembro, y cualquier miembro es autor de lo que crea.

## 2. Qué ve cada rol

| Pantalla                               | Visitante           | Miembro                                                  | Administrador                                                                |
| -------------------------------------- | ------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `/` (inicio)                           | ✅                  | ✅                                                       | ✅                                                                           |
| `/login`                               | ✅                  | Redirige a `/feed`                                       | Redirige a `/feed`                                                           |
| `/feed` (Inicio de la comunidad)       | Redirige a `/login` | ✅ Posts de los espacios que sigue                       | ✅                                                                           |
| `/feed/[espacio]`                      | Redirige a `/login` | ✅                                                       | ✅                                                                           |
| `/feed/post/[id]` (detalle)            | Redirige a `/login` | ✅                                                       | ✅                                                                           |
| Composer en Inicio                     | —                   | ✅ Solo puede elegir **General**                         | ✅ Elige **General** o **Anuncios**                                          |
| Composer en `/feed/anuncios`           | —                   | ❌ No se muestra                                         | ✅                                                                           |
| Botón "Unirme" / "Salir del espacio"   | —                   | ✅ En cada espacio                                       | ✅                                                                           |
| Perfil `/feed/u/[id]`                  | Redirige a `/login` | ✅ De cualquier miembro (el propio con la etiqueta "Tú") | ✅                                                                           |
| Campana de notificaciones (encabezado) | —                   | ✅ Solo las suyas                                        | ✅ Solo las suyas                                                            |
| Panel `apps/admin` → `/moderacion`     | Redirige a `/login` | "No tienes acceso al panel"                              | ✅ Publicaciones recientes, detalle con comentarios, eliminadas y bloqueados |
| `/feed` siendo **miembro bloqueado**   | —                   | "Tu cuenta está suspendida" (sin acceso al feed)         | —                                                                            |

## 3. Qué puede hacer cada rol

| Acción                                                            | Visitante | Miembro                                                | Autor (sobre lo suyo)                                                     | Administrador                                   | Dónde se aplica                                                               |
| ----------------------------------------------------------------- | --------- | ------------------------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Iniciar sesión (solo Google)                                      | ✅        | —                                                      | —                                                                         | —                                               | Better Auth                                                                   |
| Leer posts y comentarios de los espacios                          | ❌        | ✅                                                     | —                                                                         | ✅                                              | Página (sesión) + Stream (`visible`)                                          |
| Ver el perfil de un miembro (sus posts)                           | ❌        | ✅                                                     | —                                                                         | ✅                                              | Página (sesión) + Stream (`visible`)                                          |
| Publicar en **General**                                           | ❌        | ✅                                                     | —                                                                         | ✅                                              | Server action `createPost`                                                    |
| Publicar en **Anuncios**                                          | ❌        | ❌                                                     | —                                                                         | ✅                                              | UI + `createPost` (`adminOnly`)                                               |
| Publicar directo con la API de Stream (espacios y perfiles)       | ❌        | ❌ (403)                                               | —                                                                         | ❌ (403)                                        | Stream: feeds de `system` con visibilidad `visible`                           |
| Adjuntar imágenes a un post                                       | ❌        | ✅ (ver límites)                                       | —                                                                         | ✅                                              | Composer + `createPost`                                                       |
| Dar / quitar "me gusta" a un post                                 | ❌        | ✅ (uno por persona)                                   | ✅ (también a lo suyo)                                                    | ✅                                              | SDK de Stream en el navegador (`enforce_unique`)                              |
| Dar / quitar "me gusta" a un comentario o respuesta               | ❌        | ✅ (uno por persona)                                   | ✅ (también a lo suyo)                                                    | ✅                                              | SDK de Stream en el navegador (`addCommentReaction`, `enforce_unique`)        |
| Comentar un post (también en Anuncios)                            | ❌        | ✅                                                     | —                                                                         | ✅                                              | Server action `addComment` (los miembros no tienen `add-comment` en Stream)   |
| Responder un comentario (1 nivel de hilo)                         | ❌        | ✅                                                     | —                                                                         | ✅                                              | Server action `addComment`                                                    |
| Mencionar a un miembro con `@Nombre` (post o comentario)          | ❌        | ✅                                                     | —                                                                         | ✅                                              | Autocompletado + validación en `createPost` / `addComment`                    |
| Poner enlaces (URL suelta o "Insertar enlace" con texto)          | ❌        | ✅                                                     | —                                                                         | ✅                                              | Texto `[texto](https://…)`; se dibuja en `packages/ui/src/feed/rich-text.tsx` |
| Buscar publicaciones y miembros                                   | ❌        | ✅ Lupa del encabezado → `/feed/search`                | —                                                                         | ✅                                              | Página de servidor `app/feed/search` (`packages/community/src/search.ts`)     |
| Buscar en el panel (incluye bloqueados) y ver todo lo de un autor | ❌        | ❌                                                     | —                                                                         | ✅ `admin` → Buscar (`/moderacion/buscar`)      | `apps/admin/app/moderacion/buscar`                                            |
| Cerrar sesión / ir a su perfil                                    | —         | ✅ Menú del avatar en el encabezado (también en móvil) | —                                                                         | ✅ (en `admin`, solo cerrar sesión)             | `account-menu.tsx` de cada app                                                |
| Ver y marcar sus notificaciones como leídas                       | ❌        | ✅                                                     | —                                                                         | ✅                                              | SDK de Stream (feed `notification:<streamId>`)                                |
| Editar su post (texto y menciones)                                | —         | —                                                      | ✅ Menú "⋯" → Editar; queda "· editado" (marca propia `custom.edited_at`) | —                                               | Server action `updatePost`                                                    |
| Borrar su post                                                    | —         | —                                                      | ✅ Menú "⋯" → Eliminar (borrado suave: el admin puede restaurarlo)        | —                                               | Server action `deleteOwnPost`                                                 |
| Editar / borrar su comentario                                     | —         | —                                                      | ✅ Menú "⋯" del comentario                                                | —                                               | Server actions `updateComment` y `deleteOwnComment`                           |
| Borrar contenido **ajeno** (posts y comentarios)                  | ❌        | ❌ (403 verificado)                                    | —                                                                         | ✅ Desde el panel                               | Server actions de `apps/admin`                                                |
| Restaurar o eliminar definitivamente una publicación eliminada    | ❌        | ❌                                                     | —                                                                         | ✅ Desde "Eliminadas"                           | Server actions de `apps/admin`                                                |
| Editar contenido ajeno                                            | ❌        | ❌                                                     | —                                                                         | ❌                                              | —                                                                             |
| Unirse / salir de un espacio                                      | ❌        | ✅                                                     | —                                                                         | ✅                                              | SDK de Stream (el timeline sigue o deja de seguir el espacio)                 |
| Crear o editar espacios                                           | ❌        | ❌                                                     | —                                                                         | ✅ Solo con `stream:setup` y `lib/spaces.ts`    | Código + script                                                               |
| Bloquear / desbloquear miembros                                   | ❌        | ❌                                                     | —                                                                         | ✅ Desde el panel (no a sí mismo ni a `system`) | Server actions de `apps/admin` + baneo de Stream                              |
| Cambiar su `streamId`                                             | —         | ❌ (400)                                               | —                                                                         | ❌                                              | Hook de Better Auth                                                           |

## 4. El autor (owner) de un post

- El autor es quien lo publicó: `activity.user.id === streamId` del miembro. No se transfiere.
- Los posts de usuarios se publican **siempre** desde el servidor (`createPost`) con su `streamId` como autor; el cliente no puede elegir otro autor.
- Un post vive en dos feeds: `space:<espacio>` (lo que leen los demás) y `profile:<streamId>` (su perfil). Ambos son de `system`, así que solo el servidor publica en ellos.
- El autor puede **editar** el texto y las menciones de su post (no las imágenes ni el espacio) y **eliminarlo**, desde el menú "⋯". Igual con sus comentarios. Todo pasa por el servidor, que comprueba que sea el autor (verificado: repetir la acción con un post ajeno responde "Solo puedes editar tus publicaciones.").
- Editar avisa solo a quien se menciona por primera vez. Eliminar es suave: lo eliminado aparece en el panel de moderación y un administrador puede restaurarlo.
- Los miembros no tienen en Stream `update-*-owner` ni `delete-*-owner` (los quita `stream:setup`): editar o borrar directo con la API da 403 (verificado).
- Los posts del **Sistema** (bienvenida) solo los cambia el script `stream:setup`.

## 5. Espacios

| Espacio    | Quién publica        | Quién lee y comenta | Lo sigue el timeline de Inicio                       |
| ---------- | -------------------- | ------------------- | ---------------------------------------------------- |
| `general`  | Miembros y admins    | Miembros            | Al entrar por primera vez; luego cada miembro decide |
| `anuncios` | Solo administradores | Miembros            | Al entrar por primera vez; luego cada miembro decide |

- Los espacios se definen en `apps/web/lib/spaces.ts` (`adminOnly` marca los de solo-admin) y se crean con `pnpm --filter web stream:setup`.
- En Stream son feeds del grupo `space`, dueño `system`, visibilidad **`visible`**: cualquier usuario lee, reacciona y sigue, pero solo el dueño puede publicar, y los miembros no tienen `add-comment` (lo quita `stream:setup`): publicaciones y comentarios entran por el servidor. Por eso los posts de usuarios entran por el servidor.
- La **primera vez** que un miembro entra, su timeline sigue **todos** los espacios (onboarding en `lib/onboarding.ts`). Después puede salir y volver a unirse desde cada espacio; el onboarding no lo vuelve a unir.
- Salir de un espacio solo quita sus posts de Inicio: el espacio se puede seguir leyendo y comentando desde el menú.

## 6. Perfiles

- Cada miembro tiene un perfil en `/feed/u/<streamId>` con sus publicaciones en los espacios. El usuario `system` no tiene perfil (404).
- En Stream es el feed `profile:<streamId>`, de `system` y con visibilidad `visible`: cualquier miembro lo lee, nadie publica directo (403 verificado); los posts entran por `createPost`.
- Los posts publicados antes del PR 4 no aparecen en el perfil (vivían en el feed `user:<streamId>`, que ya no se usa).
- Stream deja a cualquier usuario **crear** un feed que aún no existe y lo deja como dueño. Por eso el servidor crea los perfiles y timelines con `getOrCreateOwnedFeed` (onboarding, página de perfil y `stream:setup`): si el dueño no es el esperado, transfiere el feed y borra lo que publicó el intruso (verificado).

## 7. Notificaciones

| Recibe la notificación | Cuando                                      | Texto en la campana                  |
| ---------------------- | ------------------------------------------- | ------------------------------------ |
| Autor del post         | Alguien da "me gusta" a su post             | "Ana reaccionó a tu publicación"     |
| Autor del post         | Alguien comenta su post                     | "Ana comentó tu publicación"         |
| Autor del comentario   | Alguien responde su comentario              | "Ana respondió a tu comentario"      |
| Autor del comentario   | Alguien da "me gusta" a su comentario       | "Ana reaccionó a tu comentario"      |
| Miembro mencionado     | Lo mencionan con `@Nombre` en un post       | "Ana te mencionó en una publicación" |
| Miembro mencionado     | Lo mencionan con `@Nombre` en un comentario | "Ana te mencionó en un comentario"   |

- Las propias acciones no notifican (verificado: un like o comentario en tu propio post no te crea notificación).
- Quitar un "me gusta" (de un post o de un comentario) borra su notificación.
- Si el destinatario ya no existe (miembro borrado), la acción se hace sin notificación: Stream crea el comentario y luego falla al notificar (no es atómico), así que `addComment` comprueba antes al destinatario.
- Las notificaciones **no cuentan** para el tope de 5k actividades al mes (confirmado en el dashboard el 2026-10-08: 5 notificaciones de likes no movieron el contador).
- Stream agrupa por publicación, tipo y día: "Ana y 2 personas más comentaron tu publicación".
- El globo cuenta las **no vistas**; al abrir la campana se marcan todas como vistas. Cada notificación queda **leída** al abrirla, o todas con "Marcar todo como leído".
- Cada notificación lleva a la publicación (`/feed/post/<id>`).
- El feed `notification:<streamId>` es del miembro; lo crea el onboarding con `getOrCreateOwnedFeed` (si alguien se adelantó solo se transfiere: las notificaciones las crean otros, así que no se borra nada).

## 8. Moderación

- El panel vive en `apps/admin` (puerto 3001), con su propio login de Google. Solo entra quien tiene su correo en `ADMIN_EMAILS`; cualquier otra sesión ve "No tienes acceso al panel".
- Las sesiones de `admin` usan cookies con prefijo `admin.*` para no pisar las de `web` (las cookies de `localhost` no distinguen puertos).
- Todas las acciones son **server actions** que verifican que quien llama sea administrador y usan el SDK de servidor de Stream:
  - **Eliminar publicación:** borrado suave; desaparece de espacios, Inicio y perfil (verificado) y queda en "Eliminadas".
  - **Restaurar publicación:** desde "Eliminadas"; vuelve a los feeds con sus comentarios (verificado).
  - **Eliminar definitivamente:** solo desde "Eliminadas" (nunca como primer paso); borra la publicación de Stream sin vuelta atrás (verificado). Para contenido que no debe conservarse.
  - **Eliminar comentario:** sus respuestas se mantienen.
  - **Bloquear miembro** (con motivo opcional): baneo de Stream en toda la app. Con su token ya no puede leer, comentar ni reaccionar (403 verificado); `web` le muestra "Tu cuenta está suspendida", `/api/stream/token` no le da token y `createPost` lo rechaza (el SDK de servidor no respeta el baneo por sí solo).
  - **Desbloquear:** desde "Bloqueados"; vuelve a tener acceso (verificado).
- No se puede bloquear a uno mismo ni a `system`. Bloquear no borra el contenido del miembro.
- Cada acción queda en el log del servidor con el correo del administrador.

## 9. Límites y validaciones

| Regla                               | Valor                                                                                                               | Dónde se aplica                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Largo de un post                    | 1–5000 caracteres (o solo imágenes)                                                                                 | Composer + `createPost`                                                               |
| Imágenes por post                   | Máx. 4, hasta 10 MB c/u, solo `image/*`                                                                             | Composer (tamaño/tipo) + `createPost` (cantidad)                                      |
| Origen de las imágenes              | Solo `https://*.stream-io-cdn.com`                                                                                  | `createPost`                                                                          |
| Frecuencia de publicación           | 5 posts cada 10 min por miembro                                                                                     | `createPost` (`lib/rate-limit.ts`, Upstash Redis compartido por todas las instancias) |
| Largo de un comentario              | 1–2000 caracteres                                                                                                   | Composer + `addComment`                                                               |
| Menciones en un post                | Máx. 10, solo miembros que existen, sin uno mismo                                                                   | `createPost`                                                                          |
| Menciones en un comentario          | Máx. 10, solo miembros que existen, sin uno mismo                                                                   | `addComment`                                                                          |
| Frecuencia de comentarios           | 20 cada 10 min por miembro (respuestas incluidas)                                                                   | `addComment` (Upstash)                                                                |
| Frecuencia de búsquedas             | 30 por minuto por miembro                                                                                           | `/feed/search` (Upstash)                                                              |
| Búsqueda                            | 2–100 caracteres, máx. 5 palabras; cada palabra como prefijo, sin acentos; 20 resultados por página                 | `packages/community/src/search.ts`                                                    |
| Frecuencia de likes                 | Sin límite propio; uno por persona y post                                                                           | Stream (`enforce_unique`); 1000 req/min globales                                      |
| "Me gusta" por persona y post       | 1                                                                                                                   | Stream (`enforce_unique`)                                                             |
| "Me gusta" por persona y comentario | 1                                                                                                                   | Stream (`enforce_unique`)                                                             |
| Enlaces                             | Solo `http(s)`; pestaña nueva con `rel="noopener noreferrer nofollow ugc"`; el dominio real se ve al pasar el mouse | `rich-text.tsx` (render) + `insert-link-button.tsx` (composer)                        |
| Sesión                              | 7 días, se renueva al usarla                                                                                        | Better Auth (cookie cifrada, sin base de datos)                                       |
| Token de Stream                     | 1 hora, se renueva solo                                                                                             | `/api/stream/token`                                                                   |
| Identidad en Stream                 | `g_<sub de Google>`, inmutable                                                                                      | `mapProfileToUser` + hook `user.update.before`                                        |

## 10. Brechas conocidas

Reglas que hoy dependen solo de la interfaz o que Stream no hace cumplir como queremos. Cada una debe cerrarse en el PR indicado o antes de producción.

1. ~~**Feed de perfil abierto para su dueño.**~~ **Cerrada en PR 4:** el perfil es `profile:<streamId>`, de `system`. Queda el feed antiguo `user:<streamId>` (del miembro, no se muestra en ningún lado) y el propio `timeline`: el miembro puede publicar directo en ellos, pero solo lo vería él mismo en su Inicio.
2. ~~**Editar el propio post por API.**~~ **Cerrada en v2 PR 2:** editar y borrar lo propio solo por el servidor (`updatePost`, `deleteOwnPost`, `updateComment`, `deleteOwnComment`), con las mismas validaciones; directo con la API da 403.
3. ~~**Comentarios y likes sin límite propio.**~~ **Comentarios cerrada en v2 PR 1** (20 cada 10 min, por el servidor). Los likes siguen sin límite propio: van directo del navegador, están limitados a uno por persona y post, y no cuentan para el tope de 5k (confirmado en el dashboard el 2026-10-08).
4. ~~**Largo de comentarios solo en el cliente.**~~ **Cerrada en v2 PR 1:** los comentarios solo entran por `addComment`, que valida el largo; comentar directo con la API da 403 (verificado).
5. ~~**Límite de frecuencia por proceso.**~~ **Cerrada en v2 PR 1:** Upstash Redis, compartido por todas las instancias. Si Upstash no responde, el límite deja pasar (mejor aceptar de más que bloquear a todos).
6. ~~**El administrador no es admin en Stream.**~~ **Cerrada en PR 6:** modera desde el panel de `apps/admin` con server actions (sigue sin ser admin en Stream; no lo necesita).
7. **`own_capabilities` de Stream no es confiable para la UI.** En espacios `visible` sigue listando `add-activity` aunque publicar devuelve 403; la UI decide con `canPostIn` (`lib/spaces.ts`).
8. ~~**Menciones en comentarios sin validar en el servidor.**~~ **Cerrada en v2 PR 1:** `addComment` las valida igual que `createPost`.
9. **"Eliminadas" revisa solo las últimas 500 publicaciones.** Stream no permite filtrar por fecha de borrado, así que una publicación eliminada más antigua no aparece en la lista (se puede restaurar por API). Restaurar comentarios no tiene UI (Stream lo permite con `restoreComment`).

### Enlaces y "· editado"

- Un enlace con texto oculta la URL, la forma clásica de phishing: por eso solo se aceptan `http`/`https` (nunca `javascript:`), se abre en pestaña nueva sin referer y el dominio real aparece al pasar el mouse.
- **Tarjetas de enlace:** Stream lee los enlaces del texto (sueltos o con texto) y guarda su vista previa como adjunto (`og_scrape_url`). Se muestran como tarjeta con sitio, título, descripción (no en comentarios) y miniatura, máx. 3 por post o comentario y en el orden del texto. La miniatura se omite si es un favicon o una imagen inválida, y se carga sin enviar la URL de la comunidad (`referrerPolicy="no-referrer"`).
- Solo las imágenes **subidas** por el autor se muestran como foto del post (`isUploadedImage`): si un sitio no tiene `og:image`, Stream guarda su favicon como `type: "image"`, y antes se veía en grande.
- Cuando el texto tiene una URL, Stream genera la vista previa en segundo plano y **marca su propio `edited_at`**. Por eso "· editado" usa una marca propia (`custom.edited_at`) que solo ponen `updatePost` y `updateComment`. Las ediciones anteriores a este cambio ya no muestran la marca.

### Búsqueda

- Se busca por el **servidor** (con el secreto), para decidir qué se puede encontrar: solo publicaciones de los espacios (`type: "post"`), nunca las eliminadas (borrado suave) ni las de miembros bloqueados. Entre los miembros no aparecen el usuario `system` ni los bloqueados.
- Stream `$autocomplete` con varias palabras solo trata la última como prefijo; por eso se envía un filtro por palabra unido con `$and`: todas deben aparecer, en cualquier orden ("noct fotog" encuentra "fotografía nocturna").
- En el panel (`/moderacion/buscar`) la búsqueda **sí incluye a los bloqueados** y sus publicaciones, y "Ver publicaciones" filtra por autor (`?author=`), con los botones de moderación en cada resultado. Las eliminadas no aparecen (Stream las excluye); están en "Eliminadas".
- Los comentarios **no** se buscan por ahora.

## 11. Dónde vive cada regla en el código

| Regla                                         | Archivo                                                                                                                                                                                  |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Roles de administrador                        | `packages/community/src/admins.ts` (`ADMIN_EMAILS`, compartido)                                                                                                                          |
| Espacios y quién publica                      | `apps/web/lib/spaces.ts` (`adminOnly`, `canPostIn`)                                                                                                                                      |
| Publicar, comentar, editar y borrar lo propio | `apps/web/app/feed/actions.ts`; permisos de miembro en `scripts/stream-setup.ts`                                                                                                         |
| Límite de frecuencia                          | `apps/web/lib/rate-limit.ts`                                                                                                                                                             |
| Sesión e identidad                            | `apps/web/lib/auth.ts`                                                                                                                                                                   |
| Onboarding (seguir espacios)                  | `apps/web/lib/onboarding.ts`                                                                                                                                                             |
| Permisos en Stream (visibilidad)              | `apps/web/scripts/stream-setup.ts`                                                                                                                                                       |
| Ids de feeds y usuario `system`               | `apps/web/lib/feeds.ts`                                                                                                                                                                  |
| Dueño de perfiles y timelines                 | `apps/web/lib/owned-feed.ts` (`getOrCreateOwnedFeed`)                                                                                                                                    |
| Unirse / salir de un espacio                  | `apps/web/app/feed/space-membership-button.tsx`                                                                                                                                          |
| Notificaciones (campana y textos)             | `apps/web/app/feed/notifications-menu.tsx`                                                                                                                                               |
| Búsqueda                                      | `packages/community/src/search.ts`, `apps/web/app/feed/search/`, `apps/admin/app/moderacion/buscar/`, `packages/ui/src/feed/search-field.tsx`, `packages/ui/src/feed/search-results.tsx` |
| Enlaces, tarjetas de enlace y "· editado"     | `packages/ui/src/feed/rich-text.tsx`, `link-preview-card.tsx`, `packages/community/src/attachments.ts`, `apps/web/lib/edited.ts`                                                         |
| Menciones (autocompletado)                    | `apps/web/app/feed/use-mentions.ts`                                                                                                                                                      |
| Panel de moderación y sus acciones            | `apps/admin/app/moderacion/` (`actions.ts`), `apps/admin/lib/session.ts`                                                                                                                 |
| Miembro bloqueado en `web`                    | `apps/web/lib/membership.ts`, `app/feed/layout.tsx`, `/api/stream/token`                                                                                                                 |
| Acceso a páginas                              | `apps/web/app/feed/layout.tsx`, `apps/web/app/login/page.tsx`                                                                                                                            |
