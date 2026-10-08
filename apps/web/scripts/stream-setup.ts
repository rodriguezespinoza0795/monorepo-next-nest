// Prepara la app de Stream: crea el feed group `space`, los espacios y las
// publicaciones de bienvenida. Es idempotente; se puede correr las veces que
// haga falta:
//   pnpm --filter web stream:setup
import { StreamClient } from "@stream-io/node-sdk";
import { SPACES } from "../lib/spaces.ts";

const SYSTEM_USER = { id: "system", name: "Equipo getStream" };

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

await client.feeds.upsertActivities({
  activities: WELCOME_POSTS.map((post) => ({
    id: post.id,
    type: "post",
    feeds: [`space:${post.space}`],
    text: post.text,
    user_id: SYSTEM_USER.id,
  })),
});
console.log(`✓ ${WELCOME_POSTS.length} publicaciones de bienvenida`);
