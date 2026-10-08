"use client";

import type { ReactNode } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

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
}

const relativeTime = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const formatRelative = (date: Date) => {
  const seconds = (date.getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeTime.format(Math.round(seconds / size), unit);
    }
  }
  return "ahora";
};

const Count = ({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number;
  label: string;
}) => (
  <Stack
    direction="row"
    spacing={0.75}
    aria-label={`${value} ${label}`}
    sx={{ alignItems: "center", color: "text.secondary" }}
  >
    {icon}
    <Typography variant="body2" component="span">
      {value}
    </Typography>
  </Stack>
);

export const PostCard = ({
  author,
  createdAt,
  text,
  space,
  images = [],
  reactionCount,
  commentCount,
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
          <time
            dateTime={createdAt.toISOString()}
            title={createdAt.toLocaleString("es")}
          >
            {formatRelative(createdAt)}
          </time>
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
      spacing={3}
      sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: "divider" }}
    >
      <Count
        icon={<FavoriteBorderIcon fontSize="small" />}
        value={reactionCount}
        label="reacciones"
      />
      <Count
        icon={<ChatBubbleOutlineIcon fontSize="small" />}
        value={commentCount}
        label="comentarios"
      />
    </Stack>
  </Card>
);
