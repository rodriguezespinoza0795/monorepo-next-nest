"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LinkIcon from "@mui/icons-material/Link";

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  /** Nombre del sitio (por ejemplo "GitHub"); si falta, se usa el dominio. */
  site?: string;
  image?: string;
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const clamp = (lines: number) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
});

/**
 * Tarjeta compacta de un enlace (título, sitio y miniatura), con los datos
 * que Stream obtiene al leer el enlace. `compact` es para comentarios.
 */
export const LinkPreviewCard = ({
  preview,
  compact = false,
}: {
  preview: LinkPreview;
  compact?: boolean;
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const host = hostOf(preview.url);
  const showImage = Boolean(preview.image) && !imageFailed;
  const size = compact ? 56 : { xs: 72, sm: 96 };

  return (
    <Box
      component="a"
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      sx={{
        display: "flex",
        alignItems: "stretch",
        gap: compact ? 1.25 : 1.75,
        p: compact ? 1 : 1.25,
        mt: compact ? 1 : 2,
        minWidth: 0,
        color: "inherit",
        textDecoration: "none",
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        bgcolor: "rgba(255,255,255,.03)",
        transition: "border-color .15s, background-color .15s",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: "rgba(99,102,241,.06)",
        },
        "&:focus-visible": {
          outline: 2,
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: size,
          height: size,
          borderRadius: 2,
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          bgcolor: "rgba(99,102,241,.12)",
          color: "primary.light",
        }}
      >
        {showImage ? (
          <Box
            component="img"
            src={preview.image}
            alt=""
            loading="lazy"
            // El sitio externo no recibe la URL de la comunidad.
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <LinkIcon />
        )}
      </Box>
      <Stack sx={{ minWidth: 0, justifyContent: "center" }} spacing={0.25}>
        <Typography
          variant="caption"
          noWrap
          sx={{ color: "text.secondary", letterSpacing: ".02em" }}
        >
          {preview.site && preview.site !== host
            ? `${preview.site} · ${host}`
            : host}
        </Typography>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: compact ? 13 : 15,
            lineHeight: 1.35,
            overflowWrap: "anywhere",
            ...clamp(2),
          }}
        >
          {preview.title ?? preview.url}
        </Typography>
        {!compact && preview.description && (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              lineHeight: 1.5,
              overflowWrap: "anywhere",
              ...clamp(2),
            }}
          >
            {preview.description}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

/** Vistas previas de los enlaces de un post o comentario. */
export const LinkPreviews = ({
  previews,
  compact = false,
}: {
  previews: LinkPreview[];
  compact?: boolean;
}) =>
  previews.map((preview) => (
    <LinkPreviewCard key={preview.url} preview={preview} compact={compact} />
  ));
