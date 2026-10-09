"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";

const DEBOUNCE_MS = 400;

// Buscador: actualiza `?q=` mientras se escribe (con pausa) y el servidor
// devuelve los resultados. Conserva la pestaña elegida.
export const SearchForm = ({
  initialQuery,
  tab,
  minLength,
  maxLength,
}: {
  initialQuery: string;
  tab: string;
  minLength: number;
  maxLength: number;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const navigate = (query: string) => {
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    if (tab !== "posts") params.set("tab", tab);
    const search = params.toString();
    startTransition(() =>
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      }),
    );
  };

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current);
        navigate(value);
      }}
    >
      <TextField
        type="search"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          clearTimeout(timer.current);
          const trimmed = next.trim();
          if (trimmed.length === 0 || trimmed.length >= minLength) {
            timer.current = setTimeout(() => navigate(next), DEBOUNCE_MS);
          }
        }}
        placeholder="Busca publicaciones o miembros"
        autoFocus={!initialQuery}
        fullWidth
        slotProps={{
          htmlInput: {
            "aria-label": "Buscar en la comunidad",
            maxLength,
            enterKeyHint: "search",
          },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: pending ? (
              <InputAdornment position="end">
                <CircularProgress size={18} aria-label="Buscando" />
              </InputAdornment>
            ) : undefined,
          },
        }}
      />
    </form>
  );
};
