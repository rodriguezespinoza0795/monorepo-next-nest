import "server-only";
import { stream } from "./stream";

// Directorio de miembros: usuarios de Stream sin el usuario `system` ni los
// bloqueados (filtrados en Stream, para que `offset` pagine bien). Stream no
// deja filtrar por "tiene nombre": los usuarios sin nombre (restos del
// dashboard de Stream o borrados) se descartan después; una página puede
// traer menos de `PAGE_SIZE`, pero la paginación sigue siendo correcta.

export const MEMBERS_PAGE_SIZE = 24;
const SYSTEM_USER_ID = "system";

export type MemberSort = "recent" | "name";

export interface Member {
  id: string;
  name: string;
  image?: string;
  joinedAt: string;
}

interface StreamUser {
  id: string;
  name?: string;
  image?: string;
  created_at: Date;
}

const toMember = (user: StreamUser & { name: string }): Member => ({
  id: user.id,
  name: user.name,
  image: user.image,
  joinedAt: new Date(user.created_at).toISOString(),
});

const isMember = <T extends StreamUser>(
  user: T,
): user is T & { name: string } => Boolean(user.name?.trim());

export const listMembers = async ({
  sort = "recent",
  page = 0,
  limit = MEMBERS_PAGE_SIZE,
}: { sort?: MemberSort; page?: number; limit?: number } = {}) => {
  const { users } = await stream.queryUsers({
    payload: {
      filter_conditions: { id: { $nin: [SYSTEM_USER_ID] }, banned: false },
      sort:
        sort === "name"
          ? [{ field: "name", direction: 1 }]
          : [{ field: "created_at", direction: -1 }],
      limit,
      offset: page * limit,
    },
  });
  return {
    members: users.filter(isMember).map(toMember),
    hasMore: users.length === limit,
  };
};
