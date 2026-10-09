import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Stack from "@mui/material/Stack";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import { EmptyState } from "@repo/ui/feed/empty-state";
import { FeedHeader } from "@repo/ui/feed/feed-header";
import { isUploadedImage } from "@repo/community/attachments";
import { BRAND } from "@repo/community/brand";
import { auth } from "../../../lib/auth";
import { takeRateLimit } from "../../../lib/rate-limit";
import {
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  normalizeQuery,
  searchMembers,
  searchPosts,
} from "@repo/community/search";
import { SPACES } from "../../../lib/spaces";
import {
  MemberResults,
  MoreResults,
  PostResults,
  SearchTabs,
  type MemberHit,
  type PostHit,
  type SearchTab,
} from "./results";
import { SearchForm } from "./search-form";

export const metadata: Metadata = { title: `Buscar · ${BRAND.name}` };

const spaceNames = new Map(
  SPACES.map((space) => [`space:${space.id}`, space.name]),
);

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function SearchPage({
  searchParams,
}: PageProps<"/feed/search">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const params = await searchParams;
  const rawQuery = first(params.q) ?? "";
  const query = normalizeQuery(rawQuery);
  const tab: SearchTab = first(params.tab) === "members" ? "members" : "posts";
  const next = first(params.next);

  const header = (
    <FeedHeader
      title="Buscar"
      description="Encuentra publicaciones de los espacios y miembros de la comunidad."
    />
  );
  const form = (
    <SearchForm
      // Remonta el campo si la URL cambia desde fuera (atrás / adelante).
      key={rawQuery}
      initialQuery={rawQuery}
      tab={tab}
      minLength={MIN_QUERY_LENGTH}
      maxLength={MAX_QUERY_LENGTH}
    />
  );

  if (!query) {
    return (
      <Stack spacing={2.5}>
        {header}
        {form}
        <EmptyState
          icon={<ManageSearchIcon fontSize="inherit" />}
          title="¿Qué estás buscando?"
          description={`Escribe al menos ${MIN_QUERY_LENGTH} letras. Basta con el inicio de cada palabra y no importan los acentos.`}
        />
      </Stack>
    );
  }

  if (!(await takeRateLimit("search", session.user.streamId))) {
    return (
      <Stack spacing={2.5}>
        {header}
        {form}
        <EmptyState
          title="Demasiadas búsquedas"
          description="Espera un minuto y vuelve a intentarlo."
        />
      </Stack>
    );
  }

  const [{ posts, next: nextPage }, users] = await Promise.all([
    searchPosts({ query, next }),
    searchMembers(query),
  ]);

  const postHits: PostHit[] = posts.map((activity) => ({
    id: activity.id,
    text: activity.text ?? "",
    createdAt: activity.created_at.toISOString(),
    author: {
      id: activity.user.id,
      name: activity.user.name ?? activity.user.id,
      image: activity.user.image,
    },
    space: activity.feeds
      .map((fid) => spaceNames.get(fid))
      .find((name) => name !== undefined),
    imageCount: activity.attachments.filter(isUploadedImage).length,
  }));
  const memberHits: MemberHit[] = users.map((user) => ({
    id: user.id,
    name: user.name ?? user.id,
    image: user.image,
  }));

  const results =
    tab === "posts" ? (
      postHits.length > 0 ? (
        <Stack spacing={2}>
          <PostResults posts={postHits} query={query} />
          {nextPage && <MoreResults query={query} next={nextPage} />}
        </Stack>
      ) : (
        <EmptyState
          icon={<SearchOffIcon fontSize="inherit" />}
          title={next ? "No hay más resultados" : "Sin publicaciones"}
          description={`No encontramos publicaciones con "${query}".`}
        />
      )
    ) : memberHits.length > 0 ? (
      <MemberResults members={memberHits} query={query} />
    ) : (
      <EmptyState
        icon={<SearchOffIcon fontSize="inherit" />}
        title="Sin miembros"
        description={`Nadie en la comunidad se llama "${query}".`}
      />
    );

  return (
    <Stack spacing={2.5}>
      {header}
      {form}
      <SearchTabs
        query={query}
        tab={tab}
        postCount={postHits.length}
        morePosts={Boolean(nextPage)}
        memberCount={memberHits.length}
      />
      {results}
    </Stack>
  );
}
