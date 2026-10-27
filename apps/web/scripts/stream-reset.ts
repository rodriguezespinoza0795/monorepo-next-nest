// Vacía la app de Stream para empezar de cero (versión 2: los miembros pasan
// de `g_<sub de Google>` a `f_<uid de Firebase>`, así que los anteriores
// quedarían huérfanos). Borra todas las publicaciones, también las de
// bienvenida (para que sus contadores vuelvan a cero), los feeds de los
// miembros y los miembros. Deja los grupos de feeds, los espacios y el
// usuario `system`. Después hay que correr `stream:setup`, que vuelve a crear
// las publicaciones de bienvenida (2 actividades).
//
// Sin `--confirm` solo cuenta lo que borraría. NO SE PUEDE DESHACER. No lo
// corras contra la app de pruebas mientras corren las E2E (también el CI).
//   pnpm --filter web stream:reset                 # desarrollo, solo cuenta
//   pnpm --filter web stream:reset -- --confirm    # desarrollo, borra
//   pnpm --filter web stream:reset:prod            # producción, solo cuenta
import { StreamClient } from "@stream-io/node-sdk";
import { SYSTEM_USER_ID } from "../lib/feeds.ts";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const secret = process.env.STREAM_API_SECRET;
if (!apiKey || !secret) {
  throw new Error("Faltan NEXT_PUBLIC_STREAM_API_KEY o STREAM_API_SECRET");
}
const confirm = process.argv.includes("--confirm");
const client = new StreamClient(apiKey, secret);

// Feeds propios de cada miembro (`user` es el antiguo, ver reglas de negocio).
const MEMBER_FEED_GROUPS = ["timeline", "notification", "profile", "user"];
const BATCH = 100;

const chunks = <T>(items: T[]) =>
  Array.from({ length: Math.ceil(items.length / BATCH) }, (_, i) =>
    items.slice(i * BATCH, (i + 1) * BATCH),
  );

// Miembros: todos los usuarios menos `system` y el del dashboard.
const memberIds: string[] = [];
for (let offset = 0; ; offset += BATCH) {
  const { users } = await client.queryUsers({
    payload: {
      filter_conditions: { id: { $nin: [SYSTEM_USER_ID] } },
      limit: BATCH,
      offset,
    },
  });
  // El usuario del dashboard de Stream no se puede borrar (ni hace falta).
  memberIds.push(
    ...users
      .filter((user) => !user.custom?.dashboard_user)
      .map((user) => user.id),
  );
  if (users.length < BATCH) break;
}

// Publicaciones (de cualquiera, también las borradas suavemente).
const queryPosts = (next?: string) =>
  client.feeds.queryActivities({
    filter: { activity_type: "post" },
    include_soft_deleted_activities: true,
    limit: BATCH,
    next,
  });

let postCount = 0;
for (let next: string | undefined, first = true; first || next; first = false) {
  const page = await queryPosts(next);
  postCount += page.activities.length;
  next = page.next;
}

console.log(`App de Stream ${apiKey}`);
console.log(`  miembros: ${memberIds.length}`);
console.log(`  publicaciones: ${postCount}`);
console.log(
  `  feeds de miembros: hasta ${memberIds.length * MEMBER_FEED_GROUPS.length}`,
);

if (!confirm) {
  console.log("\nSolo conteo. Para borrar de verdad, agrega --confirm.");
  process.exit(0);
}

// Al borrar en duro, cada página nueva trae las siguientes.
for (;;) {
  const { activities } = await queryPosts();
  if (activities.length === 0) break;
  await client.feeds.deleteActivities({
    ids: activities.map((activity) => activity.id),
    hard_delete: true,
    delete_notification_activity: true,
  });
}
console.log("✓ publicaciones borradas");

// De uno en uno (en grupos): el borrado en lote falla entero si falta alguno,
// y no todos los miembros tienen los cuatro feeds.
const isNotFound = (error: unknown) =>
  (error as { code?: number } | null)?.code === 16;
const memberFeeds = memberIds.flatMap((id) =>
  MEMBER_FEED_GROUPS.map((group) => ({ feed_group_id: group, feed_id: id })),
);
for (const feeds of chunks(memberFeeds)) {
  await Promise.all(
    feeds.map((feed) =>
      client.feeds
        .deleteFeed({ ...feed, hard_delete: true })
        .catch((error: unknown) => {
          if (!isNotFound(error)) throw error;
        }),
    ),
  );
}
console.log("✓ feeds de miembros borrados");

for (const user_ids of chunks(memberIds)) {
  await client.deleteUsers({ user_ids, user: "hard" });
}
console.log(
  "✓ miembros borrados (Stream termina de borrarlos en segundo plano)",
);
console.log(
  "\nAhora corre stream:setup para recrear las publicaciones de bienvenida.",
);
