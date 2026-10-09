// Prepara la app de Stream: crea el feed group `space`, los espacios y las
// publicaciones de bienvenida. Es idempotente; se puede correr las veces que
// haga falta:
//   pnpm --filter web stream:setup
import { StreamClient } from "@stream-io/node-sdk";
import { SYSTEM_USER_ID } from "../lib/feeds.ts";
import { getOrCreateOwnedFeed } from "../lib/owned-feed.ts";
import { SPACES } from "../lib/spaces.ts";
import { TEAM_NAME } from "@repo/community/brand";

const SYSTEM_USER = { id: SYSTEM_USER_ID, name: TEAM_NAME };

// Ids fijos para que volver a correr el script no duplique las publicaciones.
const WELCOME_POSTS = [
  {
    id: "welcome-anuncios",
    space: "anuncios",
    text: "¡Bienvenida, bienvenido a la comunidad! 👋\n\nEste es el espacio de anuncios: aquí publicaremos las novedades del equipo. Para conversar, pasa a General.",
  },
  {
    id: "welcome-general",
    space: "general",
    text: "Preséntate 🙌\n\nCuéntanos quién eres, en qué trabajas y qué te gustaría encontrar en esta comunidad.",
  },
];

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const secret = process.env.STREAM_API_SECRET;
if (!apiKey || !secret) {
  throw new Error("Faltan NEXT_PUBLIC_STREAM_API_KEY o STREAM_API_SECRET");
}

const client = new StreamClient(apiKey, secret);

await client.upsertUsers([SYSTEM_USER]);

// Visibilidad `visible`: cualquier usuario lee, comenta, reacciona y sigue,
// pero solo el dueño del feed (`system`) puede publicar. Los posts de los
// usuarios entran por la server action `createPost`, que usa el SDK de
// servidor; así nadie se salta los permisos ni el límite de frecuencia
// publicando directo con su token. Ver docs/reglas-de-negocio.md.
const SPACE_VISIBILITY = "visible";

await client.feeds.getOrCreateFeedGroup({
  id: "space",
  default_visibility: SPACE_VISIBILITY,
});
await client.feeds.updateFeedGroup({
  id: "space",
  default_visibility: SPACE_VISIBILITY,
});
console.log("✓ feed group `space`");

// Perfiles de miembros (`profile:<streamId>`), también de `system` y
// `visible`: cualquiera los lee, solo el servidor publica en ellos.
await client.feeds.getOrCreateFeedGroup({
  id: "profile",
  default_visibility: SPACE_VISIBILITY,
});
console.log("✓ feed group `profile`");

// Comentar, editar, borrar y destacar entran solo por server actions
// (`addComment`, `updatePost`, `deleteOwnPost`, `setPostPinned`, …), que
// validan largo, menciones, autoría, rol, bloqueo y frecuencia. Se quitan estos permisos a los roles de miembro en la
// visibilidad `visible` (espacios, perfiles, timelines) para que nadie los
// use directo con su token. Admins y moderadores de Stream los conservan; el
// SDK de servidor no pasa por estos permisos.
const MEMBER_ROLES = ["user", "feed_follower", "feed_member"];
const SERVER_ONLY_PERMISSIONS = [
  "add-comment",
  "update-activities-owner",
  "delete-activities-owner",
  "update-comment-owner",
  "delete-comment-owner",
  // Destacar: solo admins, por `setPostPinned`.
  "pin-activity-owner",
];
const { feed_visibility } = await client.feeds.getFeedVisibility({
  name: SPACE_VISIBILITY,
});
const grants = Object.fromEntries(
  Object.entries(feed_visibility.grants).map(([role, permissions]) => [
    role,
    MEMBER_ROLES.includes(role)
      ? permissions.filter(
          (permission) => !SERVER_ONLY_PERMISSIONS.includes(permission),
        )
      : permissions,
  ]),
);
await client.feeds.updateFeedVisibility({ name: SPACE_VISIBILITY, grants });
console.log("✓ comentar, editar, borrar y destacar solo por el servidor");

// Perfiles de los miembros que ya existen (los nuevos los crea el onboarding),
// para que nadie se adelante a crearlos y quede como dueño.
const { users: members } = await client.queryUsers({
  payload: { filter_conditions: { id: { $autocomplete: "g_" } }, limit: 100 },
});
for (const member of members.filter((user) => user.id.startsWith("g_"))) {
  await getOrCreateOwnedFeed(client, {
    group: "profile",
    id: member.id,
    ownerId: SYSTEM_USER_ID,
    authorId: member.id,
  });
}
console.log(`✓ perfiles de ${members.length} miembros`);

for (const space of SPACES) {
  const { created } = await client.feeds.getOrCreateFeed({
    feed_group_id: "space",
    feed_id: space.id,
    user_id: SYSTEM_USER.id,
    data: {
      name: space.name,
      description: space.description,
      visibility: SPACE_VISIBILITY,
    },
  });
  // `getOrCreateFeed` no cambia la visibilidad de un feed que ya existe.
  await client.feeds.changeFeedVisibility({
    feed_group_id: "space",
    feed_id: space.id,
    visibility: SPACE_VISIBILITY,
  });
  console.log(`✓ space:${space.id}${created ? " (creado)" : ""}`);
}

// Solo se publican las que falten: cada post cuenta para el tope mensual de
// actividades del plan gratuito, aunque sea un upsert de uno existente.
const { activities: existing } = await client.feeds.queryActivities({
  filter: { id: { $in: WELCOME_POSTS.map((post) => post.id) } },
  limit: WELCOME_POSTS.length,
});
const existingIds = new Set(existing.map((activity) => activity.id));
const missing = WELCOME_POSTS.filter((post) => !existingIds.has(post.id));
if (missing.length > 0) {
  await client.feeds.upsertActivities({
    activities: missing.map((post) => ({
      id: post.id,
      type: "post",
      feeds: [`space:${post.space}`],
      text: post.text,
      user_id: SYSTEM_USER.id,
    })),
  });
}
console.log(
  `✓ publicaciones de bienvenida (${missing.length} nuevas, ${existingIds.size} ya existían)`,
);
