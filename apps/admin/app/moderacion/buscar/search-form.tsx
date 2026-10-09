"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { SearchField } from "@repo/ui/feed/search-field";

// Buscador del panel: actualiza `?q=` (conserva pestaña y autor).
export const SearchForm = ({
  initialQuery,
  tab,
  author,
  minLength,
  maxLength,
}: {
  initialQuery: string;
  tab: string;
  author?: string;
  minLength: number;
  maxLength: number;
}) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const search = (query: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (tab !== "posts") params.set("tab", tab);
    if (author) params.set("author", author);
    const qs = params.toString();
    startTransition(() =>
      router.replace(`/moderacion/buscar${qs ? `?${qs}` : ""}`, {
        scroll: false,
      }),
    );
  };

  return (
    <SearchField
      initialQuery={initialQuery}
      onSearch={search}
      pending={pending}
      placeholder={
        author
          ? "Filtra sus publicaciones por texto"
          : "Busca publicaciones o miembros"
      }
      label="Buscar en el panel"
      minLength={minLength}
      maxLength={maxLength}
    />
  );
};
