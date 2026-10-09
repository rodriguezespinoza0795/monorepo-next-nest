import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Stack from "@mui/material/Stack";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { BRAND } from "@repo/community/brand";
import {
  listMembers,
  type Member,
  type MemberSort,
} from "@repo/community/members";
import {
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  normalizeQuery,
  searchMembers,
} from "@repo/community/search";
import { EmptyState } from "@repo/ui/feed/empty-state";
import { FeedHeader } from "@repo/ui/feed/feed-header";
import { auth } from "../../../lib/auth";
import { takeRateLimit } from "../../../lib/rate-limit";
import { MembersControls, MembersGrid } from "./members-view";

export const metadata: Metadata = { title: `Miembros · ${BRAND.name}` };

const MAX_PAGE = 50;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function MembersPage({
  searchParams,
}: PageProps<"/feed/members">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const params = await searchParams;
  const rawQuery = first(params.q) ?? "";
  const query = normalizeQuery(rawQuery);
  const sort: MemberSort = first(params.sort) === "name" ? "name" : "recent";
  const pageParam = Number.parseInt(first(params.page) ?? "1", 10);
  const page =
    Number.isFinite(pageParam) && pageParam > 1
      ? Math.min(pageParam, MAX_PAGE) - 1
      : 0;

  let members: Member[] = [];
  let hasMore = false;
  let limited = false;
  if (query) {
    // Filtrar por nombre es una búsqueda: mismo límite de frecuencia.
    limited = !(await takeRateLimit("search", session.user.streamId));
    if (!limited) {
      members = (await searchMembers(query))
        .filter((user) => user.name?.trim())
        .map((user) => ({
          id: user.id,
          name: user.name as string,
          image: user.image,
          joinedAt: new Date(user.created_at).toISOString(),
        }));
    }
  } else {
    ({ members, hasMore } = await listMembers({ sort, page }));
  }

  return (
    <Stack spacing={2.5}>
      <FeedHeader
        title="Miembros"
        description="Las personas de la comunidad. Entra a su perfil para ver lo que comparten."
      />
      <MembersControls
        // Remonta el campo si la URL cambia desde fuera (atrás / adelante).
        key={rawQuery}
        query={query ?? ""}
        sort={sort}
        minLength={MIN_QUERY_LENGTH}
        maxLength={MAX_QUERY_LENGTH}
      />
      {limited ? (
        <EmptyState
          title="Demasiadas búsquedas"
          description="Espera un minuto y vuelve a intentarlo."
        />
      ) : members.length > 0 ? (
        <MembersGrid
          members={members}
          query={query ?? ""}
          sort={sort}
          page={page}
          hasMore={hasMore}
        />
      ) : query ? (
        <EmptyState
          icon={<SearchOffIcon fontSize="inherit" />}
          title="Sin miembros"
          description={`Nadie en la comunidad se llama "${query}".`}
        />
      ) : (
        <EmptyState
          icon={<GroupsOutlinedIcon fontSize="inherit" />}
          title={page > 0 ? "No hay más miembros" : "Aún no hay miembros"}
        />
      )}
    </Stack>
  );
}
