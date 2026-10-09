import type { ElementType, ReactNode } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { RelativeTime } from "./relative-time";

const EXCERPT_LENGTH = 220;

// Minúsculas y sin acentos, carácter por carácter (mismo largo que el
// original, para poder resaltar sobre el texto real).
const fold = (text: string) =>
  [...text]
    .map((char) => {
      const folded = char.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
      return folded.length === 1 ? folded : char;
    })
    .join("");

const termsOf = (query: string) =>
  [...new Set(fold(query).split(/\s+/).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );

/** Rangos `[inicio, fin)` de `text` que coinciden con algún término. */
const matchRanges = (text: string, query: string) => {
  const folded = fold(text);
  const ranges: [number, number][] = [];
  for (const term of termsOf(query)) {
    let from = 0;
    for (;;) {
      const index = folded.indexOf(term, from);
      if (index === -1) break;
      const end = index + term.length;
      if (!ranges.some(([a, b]) => index < b && end > a)) {
        ranges.push([index, end]);
      }
      from = end;
    }
  }
  return ranges.sort((a, b) => a[0] - b[0]);
};

/** Recorta un texto largo alrededor de la primera coincidencia. */
export const excerptAround = (text: string, query: string) => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= EXCERPT_LENGTH) return clean;
  const first = matchRanges(clean, query)[0]?.[0] ?? 0;
  const start = Math.max(
    0,
    Math.min(first - 60, clean.length - EXCERPT_LENGTH),
  );
  const end = start + EXCERPT_LENGTH;
  return `${start > 0 ? "…" : ""}${clean.slice(start, end).trim()}${
    end < clean.length ? "…" : ""
  }`;
};

/** Texto con las palabras buscadas resaltadas (sin importar acentos). */
export const Highlight = ({ text, query }: { text: string; query: string }) => {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const [start, end] of matchRanges(text, query)) {
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <Box
        component="mark"
        key={start}
        sx={{
          bgcolor: "rgba(99,102,241,.28)",
          color: "text.primary",
          // Sin relleno lateral: la palabra resaltada se lee completa.
          borderRadius: 0.5,
        }}
      >
        {text.slice(start, end)}
      </Box>,
    );
    last = end;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
};

interface PostResultProps {
  href: string;
  author: { name: string; image?: string };
  space?: string;
  createdAt: Date;
  /** Texto plano del post (sin sintaxis de enlaces). */
  text: string;
  query: string;
  imageCount?: number;
  linkComponent?: ElementType;
}

/** Resultado de búsqueda de una publicación: enlaza al post. */
export const PostResult = ({
  href,
  author,
  space,
  createdAt,
  text,
  query,
  imageCount = 0,
  linkComponent = "a",
}: PostResultProps) => (
  <Card component="article">
    <CardActionArea component={linkComponent} href={href} sx={{ p: 2.25 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Avatar src={author.image} alt="" sx={{ width: 32, height: 32 }}>
          {author.name.charAt(0)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 600, fontSize: 14 }}>
            {author.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {space && <>en {space} · </>}
            <RelativeTime date={createdAt} />
          </Typography>
        </Box>
      </Stack>
      <Typography
        sx={{
          mt: 1.25,
          lineHeight: 1.6,
          overflowWrap: "anywhere",
          color: "text.primary",
        }}
      >
        {text ? (
          <Highlight text={excerptAround(text, query)} query={query} />
        ) : (
          <Box component="span" sx={{ color: "text.secondary" }}>
            Publicación con imágenes
          </Box>
        )}
      </Typography>
      {imageCount > 0 && text && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {imageCount === 1 ? "1 imagen" : `${imageCount} imágenes`}
        </Typography>
      )}
    </CardActionArea>
  </Card>
);

interface MemberResultProps {
  href?: string;
  name: string;
  image?: string;
  query: string;
  linkComponent?: ElementType;
}

/** Resultado de búsqueda de un miembro: enlaza a su perfil. */
export const MemberResult = ({
  href,
  name,
  image,
  query,
  linkComponent = "a",
}: MemberResultProps) => (
  <Card>
    <CardActionArea
      component={href ? linkComponent : "div"}
      href={href}
      sx={{ p: 2 }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Avatar src={image} alt="" sx={{ width: 40, height: 40 }}>
          {name.charAt(0)}
        </Avatar>
        <Typography sx={{ fontWeight: 600, minWidth: 0 }} noWrap>
          <Highlight text={name} query={query} />
        </Typography>
      </Stack>
    </CardActionArea>
  </Card>
);
