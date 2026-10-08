// Prepara la app de Stream: crea el feed group `space` y los espacios iniciales.
// Es idempotente; se puede correr las veces que haga falta:
//   pnpm --filter web stream:setup
import { StreamClient } from "@stream-io/node-sdk";

const SYSTEM_USER = { id: "system", name: "getStream" };

const SPACES = [
  {
    id: "general",
    name: "General",
    description: "Conversaciones abiertas de la comunidad.",
  },
  {
    id: "anuncios",
    name: "Anuncios",
    description: "Novedades del equipo.",
  },
];

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const secret = process.env.STREAM_API_SECRET;
if (!apiKey || !secret) {
  throw new Error("Faltan NEXT_PUBLIC_STREAM_API_KEY o STREAM_API_SECRET");
}

const client = new StreamClient(apiKey, secret);

await client.upsertUsers([SYSTEM_USER]);

await client.feeds.getOrCreateFeedGroup({
  id: "space",
  default_visibility: "public",
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
      visibility: "public",
    },
  });
  console.log(`✓ space:${space.id}${created ? " (creado)" : ""}`);
}
