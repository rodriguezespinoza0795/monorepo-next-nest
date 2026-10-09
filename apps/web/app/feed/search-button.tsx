"use client";

import Link from "next/link";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import SearchIcon from "@mui/icons-material/Search";

// Acceso a la búsqueda desde el encabezado (también en móvil).
export const SearchButton = () => (
  <Tooltip title="Buscar">
    <IconButton
      component={Link}
      href="/feed/search"
      aria-label="Buscar"
      sx={{ color: "text.primary" }}
    >
      <SearchIcon />
    </IconButton>
  </Tooltip>
);
