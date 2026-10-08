// Espacios de la comunidad (feeds del grupo `space`). Los crea el admin con
// `pnpm --filter web stream:setup`; por ahora todos son públicos y cada
// usuario nuevo los sigue desde su timeline.
export interface Space {
  id: string;
  name: string;
  description: string;
  /** Solo los administradores pueden publicar (los demás leen y comentan). */
  adminOnly?: boolean;
}

export const SPACES: Space[] = [
  {
    id: "general",
    name: "General",
    description: "Conversaciones abiertas de la comunidad.",
  },
  {
    id: "anuncios",
    name: "Anuncios",
    description: "Novedades del equipo.",
    adminOnly: true,
  },
];

export const findSpace = (id: string) =>
  SPACES.find((space) => space.id === id);

export const canPostIn = (space: Space, isAdmin: boolean) =>
  !space.adminOnly || isAdmin;
