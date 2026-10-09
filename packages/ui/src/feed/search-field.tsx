"use client";

import { useEffect, useRef, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";

const DEBOUNCE_MS = 400;

interface SearchFieldProps {
  initialQuery: string;
  /** Se llama tras una pausa al escribir (o al pulsar Enter). */
  onSearch: (query: string) => void;
  pending?: boolean;
  placeholder: string;
  label: string;
  minLength: number;
  maxLength: number;
}

/** Campo de búsqueda que busca solo mientras se escribe, con pausa. */
export const SearchField = ({
  initialQuery,
  onSearch,
  pending = false,
  placeholder,
  label,
  minLength,
  maxLength,
}: SearchFieldProps) => {
  const [value, setValue] = useState(initialQuery);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current);
        onSearch(value.trim());
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
          // Vacío limpia la búsqueda; muy corto no busca todavía.
          if (trimmed.length === 0 || trimmed.length >= minLength) {
            timer.current = setTimeout(() => onSearch(trimmed), DEBOUNCE_MS);
          }
        }}
        placeholder={placeholder}
        autoFocus={!initialQuery}
        fullWidth
        slotProps={{
          htmlInput: { "aria-label": label, maxLength, enterKeyHint: "search" },
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
