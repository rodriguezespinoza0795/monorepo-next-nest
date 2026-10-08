import { deleteAllTestMembers } from "./support/members";

// Una sola limpieza de usuarios por corrida (incluye restos de corridas que
// se cortaron a medias).
export default async function globalTeardown() {
  await deleteAllTestMembers();
}
