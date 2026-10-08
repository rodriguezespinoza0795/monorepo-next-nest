"use client";

import type { ElementType } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { RelativeTime } from "./relative-time";

export interface PostImage {
  url: string;
  alt?: string;
}

export interface PostCardProps {
  author: { name: string; image?: string };
  createdAt: Date;
  text?: string;
  space?: string;
  images?: PostImage[];
  reactionCount: number;
  commentCount: number;
  /** Enlace al detalle del post (fecha y botón de comentarios). */
  href?: string;
  liked?: boolean;
  onToggleLike?: () => void;
  /** Componente de enlace de la app (por ejemplo `next/link`). */
  linkComponent?: ElementType;
}

const LIKE_COLOR = "#F472B6";

const actionSx = {
  color: "text.secondary",
  fontWeight: 500,
  minWidth: 0,
  px: 1.25,
  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.06)" },
} as const;

export const PostCard = ({
  author,
  createdAt,
  text,
  space,
  images = [],
  reactionCount,
  commentCount,
  href,
  liked = false,
  onToggleLike,
  linkComponent = "a",
}: PostCardProps) => (
  <Card component="article" sx={{ p: { xs: 2.5, sm: 3 } }}>
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
      <Avatar src={author.image} alt={author.name}>
        {author.name.charAt(0)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 600, fontSize: 15 }}>
          {author.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {space && (
            <>
              en{" "}
              <Box
                component="span"
                sx={{ color: "primary.light", fontWeight: 500 }}
              >
                {space}
              </Box>{" "}
              ·{" "}
            </>
          )}
          {href ? (
            <Link
              component={linkComponent}
              href={href}
              color="inherit"
              underline="hover"
            >
              <RelativeTime date={createdAt} />
            </Link>
          ) : (
            <RelativeTime date={createdAt} />
          )}
        </Typography>
      </Box>
    </Stack>

    {text && (
      <Typography
        sx={{
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          lineHeight: 1.65,
          color: "text.primary",
        }}
      >
        {text}
      </Typography>
    )}

    {images.length > 0 && (
      <Box
        sx={{
          mt: 2,
          display: "grid",
          gap: 1,
          gridTemplateColumns: images.length > 1 ? "1fr 1fr" : "1fr",
        }}
      >
        {images.map((image) => (
          <Box
            key={image.url}
            component="img"
            src={image.url}
            alt={image.alt ?? ""}
            loading="lazy"
            sx={{
              width: "100%",
              maxHeight: 480,
              aspectRatio: images.length > 1 ? "1" : "auto",
              objectFit: "cover",
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
            }}
          />
        ))}
      </Box>
    )}

    <Stack
      direction="row"
      spacing={1}
      sx={{ mt: 2.5, mx: -1.25, pt: 1.5, borderTop: 1, borderColor: "divider" }}
    >
      <Button
        size="small"
        onClick={onToggleLike}
        disabled={!onToggleLike}
        aria-pressed={liked}
        aria-label={`Me gusta (${reactionCount})`}
        startIcon={liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        sx={{
          ...actionSx,
          ...(liked && { color: LIKE_COLOR }),
          "&.Mui-disabled": { color: "text.secondary" },
        }}
      >
        {reactionCount}
      </Button>
      {href ? (
        <Button
          size="small"
          component={linkComponent}
          href={href}
          aria-label={`Comentarios (${commentCount})`}
          startIcon={<ChatBubbleOutlineIcon />}
          sx={actionSx}
        >
          {commentCount}
        </Button>
      ) : (
        <Stack
          direction="row"
          spacing={1}
          aria-label={`Comentarios (${commentCount})`}
          sx={{ alignItems: "center", px: 1.25, color: "text.secondary" }}
        >
          <ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />
          <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
            {commentCount}
          </Typography>
        </Stack>
      )}
    </Stack>
  </Card>
);
