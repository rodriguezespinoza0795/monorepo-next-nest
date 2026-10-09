"use client";

import Link from "next/link";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { plainText } from "@repo/ui/feed/rich-text";
import { MemberResult, PostResult } from "@repo/ui/feed/search-results";
import { postHref, profileHref } from "../../../lib/routes";

export interface PostHit {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string; image?: string };
  space?: string;
  imageCount: number;
}

export interface MemberHit {
  id: string;
  name: string;
  image?: string;
}

// Resultados con enlaces de Next (un componente de servidor no puede pasar
// `Link` como prop a MUI).
export const PostResults = ({
  posts,
  query,
}: {
  posts: PostHit[];
  query: string;
}) => (
  <Stack spacing={1.5}>
    {posts.map((post) => (
      <PostResult
        key={post.id}
        href={postHref(post.id)}
        author={post.author}
        space={post.space}
        createdAt={new Date(post.createdAt)}
        text={plainText(post.text)}
        query={query}
        imageCount={post.imageCount}
        linkComponent={Link}
      />
    ))}
  </Stack>
);

export const MemberResults = ({
  members,
  query,
}: {
  members: MemberHit[];
  query: string;
}) => (
  <Stack spacing={1.5}>
    {members.map((member) => (
      <MemberResult
        key={member.id}
        href={profileHref(member.id)}
        name={member.name}
        image={member.image}
        query={query}
        linkComponent={Link}
      />
    ))}
  </Stack>
);

export type SearchTab = "posts" | "members";

const hrefFor = (query: string, tab: SearchTab, next?: string) => {
  const params = new URLSearchParams({ q: query });
  if (tab !== "posts") params.set("tab", tab);
  if (next) params.set("next", next);
  return `/feed/search?${params}`;
};

const countLabel = (count: number, more: boolean) =>
  more ? `${count}+` : String(count);

export const SearchTabs = ({
  query,
  tab,
  postCount,
  morePosts,
  memberCount,
}: {
  query: string;
  tab: SearchTab;
  postCount: number;
  morePosts: boolean;
  memberCount: number;
}) => (
  <Tabs
    value={tab}
    aria-label="Tipo de resultado"
    sx={{ borderBottom: 1, borderColor: "divider" }}
  >
    <Tab
      value="posts"
      label={`Publicaciones (${countLabel(postCount, morePosts)})`}
      component={Link}
      href={hrefFor(query, "posts")}
      replace
      scroll={false}
    />
    <Tab
      value="members"
      label={`Miembros (${memberCount})`}
      component={Link}
      href={hrefFor(query, "members")}
      replace
      scroll={false}
    />
  </Tabs>
);

export const MoreResults = ({
  query,
  next,
}: {
  query: string;
  next: string;
}) => (
  <Button
    variant="outlined"
    component={Link}
    href={hrefFor(query, "posts", next)}
    sx={{ alignSelf: "center" }}
  >
    Más resultados
  </Button>
);
