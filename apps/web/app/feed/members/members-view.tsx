"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { MemberCard } from "@repo/ui/feed/member-card";
import { SearchField } from "@repo/ui/feed/search-field";
import type { Member, MemberSort } from "@repo/community/members";
import { profileHref } from "../../../lib/routes";

const hrefFor = ({
  q,
  sort,
  page,
}: {
  q?: string;
  sort: MemberSort;
  page?: number;
}) => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sort !== "recent") params.set("sort", sort);
  if (page) params.set("page", String(page + 1));
  const qs = params.toString();
  return `/feed/members${qs ? `?${qs}` : ""}`;
};

// Filtro por nombre y orden; los cambios se reflejan en la URL y el servidor
// devuelve la lista.
export const MembersControls = ({
  query,
  sort,
  minLength,
  maxLength,
}: {
  query: string;
  sort: MemberSort;
  minLength: number;
  maxLength: number;
}) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (href: string) =>
    startTransition(() => router.replace(href, { scroll: false }));

  return (
    <Stack spacing={1.5}>
      <SearchField
        initialQuery={query}
        onSearch={(q) => go(hrefFor({ q, sort }))}
        pending={pending}
        placeholder="Busca a alguien por su nombre"
        label="Buscar miembros"
        minLength={minLength}
        maxLength={maxLength}
      />
      {!query && (
        // Enlaces reales: funcionan aunque la página aún no termine de
        // cargar su JavaScript (y se pueden abrir en otra pestaña).
        <ToggleButtonGroup
          exclusive
          size="small"
          value={sort}
          aria-label="Orden"
          sx={{ alignSelf: "flex-start" }}
        >
          {(
            [
              ["recent", "Más recientes"],
              ["name", "A–Z"],
            ] as const
          ).map(([value, label]) => (
            <ToggleButton
              key={value}
              value={value}
              component={Link}
              href={hrefFor({ sort: value })}
              replace
              scroll={false}
              aria-pressed={undefined}
              aria-current={sort === value ? "page" : undefined}
            >
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
    </Stack>
  );
};

export const MembersGrid = ({
  members,
  query,
  sort,
  page,
  hasMore,
}: {
  members: Member[];
  query: string;
  sort: MemberSort;
  page: number;
  hasMore: boolean;
}) => (
  <Stack spacing={2.5}>
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
      }}
    >
      {members.map((member) => (
        <MemberCard
          key={member.id}
          member={{
            name: member.name,
            image: member.image,
            href: profileHref(member.id),
            joinedAt: new Date(member.joinedAt),
          }}
          linkComponent={Link}
        />
      ))}
    </Box>
    {(page > 0 || hasMore) && (
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: "center" }}>
        {page > 0 && (
          <Button
            component={Link}
            href={hrefFor({ q: query, sort, page: page - 1 })}
          >
            ← Anteriores
          </Button>
        )}
        {hasMore && (
          <Button
            variant="outlined"
            component={Link}
            href={hrefFor({ q: query, sort, page: page + 1 })}
          >
            Ver más miembros
          </Button>
        )}
      </Stack>
    )}
  </Stack>
);
