import type { Metadata } from "next";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { ADMIN_BRAND } from "@repo/community/brand";
import {
  findUser,
  MAX_QUERY_LENGTH,
  MIN_QUERY_LENGTH,
  normalizeQuery,
  searchMembers,
  searchPosts,
} from "@repo/community/search";
import { EmptyState } from "@repo/ui/feed/empty-state";
import { FeedHeader } from "@repo/ui/feed/feed-header";
import { Highlight } from "@repo/ui/feed/search-results";
import {
  bannableAuthor,
  getSpaceNames,
  toPostCard,
} from "../../../lib/community-data";
import { getAdminSession } from "../../../lib/session";
import { ModerationButtons } from "../moderation-buttons";
import { PostCardLink } from "../post-card-link";
import { SearchForm } from "./search-form";

export const metadata: Metadata = { title: `Buscar · ${ADMIN_BRAND}` };

type SearchTab = "posts" | "members";

const STREAM_ID = /^[A-Za-z0-9_-]{1,64}$/;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const hrefFor = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return `/moderacion/buscar${qs ? `?${qs}` : ""}`;
};

// Búsqueda del panel: como la de la comunidad, pero incluye a los miembros
// bloqueados y permite ver todas las publicaciones de un autor para moderarlas.
export default async function AdminSearchPage({
  searchParams,
}: PageProps<"/moderacion/buscar">) {
  const { user } = await getAdminSession();
  const params = await searchParams;
  const rawQuery = first(params.q) ?? "";
  const query = normalizeQuery(rawQuery) ?? undefined;
  const authorParam = first(params.author);
  const authorId =
    authorParam && STREAM_ID.test(authorParam) ? authorParam : undefined;
  const tab: SearchTab =
    !authorId && first(params.tab) === "members" ? "members" : "posts";
  const next = first(params.next);

  const author = authorId ? await findUser(authorId) : undefined;

  const header = (
    <FeedHeader
      title="Buscar"
      description="Encuentra publicaciones y miembros, también los bloqueados, para moderarlos."
    />
  );
  const form = (
    <SearchForm
      key={`${rawQuery}|${authorId ?? ""}`}
      initialQuery={rawQuery}
      tab={tab}
      author={authorId}
      minLength={MIN_QUERY_LENGTH}
      maxLength={MAX_QUERY_LENGTH}
    />
  );
  const authorBar = authorId && (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}
    >
      <Typography sx={{ fontWeight: 600 }}>
        Publicaciones de {author?.name ?? authorId}
      </Typography>
      {author?.banned && <Chip size="small" color="error" label="Bloqueado" />}
      <Button size="small" href={hrefFor({ q: query })}>
        Quitar filtro
      </Button>
    </Stack>
  );

  if (!query && !authorId) {
    return (
      <Stack spacing={3}>
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

  const [{ posts, next: nextPage }, members, spaceNames] = await Promise.all([
    tab === "posts"
      ? searchPosts({ query, authorId, next, includeBanned: true })
      : { posts: [], next: undefined },
    query && !authorId
      ? searchMembers(query, { includeBanned: true })
      : Promise.resolve([]),
    getSpaceNames(),
  ]);

  const tabs = !authorId && query && (
    <Tabs
      value={tab}
      aria-label="Tipo de resultado"
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Tab
        value="posts"
        label="Publicaciones"
        component="a"
        href={hrefFor({ q: query })}
      />
      <Tab
        value="members"
        label={`Miembros (${members.length})`}
        component="a"
        href={hrefFor({ q: query, tab: "members" })}
      />
    </Tabs>
  );

  const postResults =
    posts.length > 0 ? (
      <Stack spacing={3}>
        {posts.map((activity) => (
          <Stack key={activity.id} spacing={1}>
            <PostCardLink
              {...toPostCard(activity, spaceNames)}
              href={`/moderacion/post/${activity.id}`}
            />
            <ModerationButtons
              target="post"
              id={activity.id}
              author={bannableAuthor(activity.user, user.streamId)}
            />
          </Stack>
        ))}
        {nextPage && (
          <Button
            variant="outlined"
            href={hrefFor({ q: query, author: authorId, next: nextPage })}
            sx={{ alignSelf: "center" }}
          >
            Más resultados
          </Button>
        )}
      </Stack>
    ) : (
      <EmptyState
        icon={<SearchOffIcon fontSize="inherit" />}
        title={next ? "No hay más resultados" : "Sin publicaciones"}
        description={
          query
            ? `No encontramos publicaciones con "${query}".`
            : "Este miembro no tiene publicaciones visibles."
        }
      />
    );

  const memberResults =
    members.length > 0 ? (
      <Stack spacing={1.5}>
        {members.map((member) => (
          <Card key={member.id} sx={{ p: 2 }}>
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}
            >
              <Avatar src={member.image} alt="" sx={{ width: 40, height: 40 }}>
                {(member.name ?? member.id).charAt(0)}
              </Avatar>
              {/* El id distingue a miembros con el mismo nombre. */}
              <Stack sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 600 }} noWrap>
                  <Highlight
                    text={member.name ?? member.id}
                    query={query ?? ""}
                  />
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {member.id}
                </Typography>
              </Stack>
              {member.banned && (
                <Chip size="small" color="error" label="Bloqueado" />
              )}
              <Button
                size="small"
                variant="outlined"
                href={hrefFor({ author: member.id })}
                aria-label={`Ver publicaciones de ${member.name ?? member.id}`}
              >
                Ver publicaciones
              </Button>
            </Stack>
          </Card>
        ))}
      </Stack>
    ) : (
      <EmptyState
        icon={<SearchOffIcon fontSize="inherit" />}
        title="Sin miembros"
        description={`Nadie en la comunidad se llama "${query}".`}
      />
    );

  return (
    <Stack spacing={3}>
      {header}
      {form}
      {authorBar}
      {tabs}
      {tab === "posts" ? postResults : memberResults}
    </Stack>
  );
}
