"use client";

import type { ElementType, ReactNode } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { RelativeTime } from "./relative-time";

interface CommentItemProps {
  /** `href` enlaza al perfil del autor. */
  author: { name: string; image?: string; href?: string };
  createdAt: Date;
  text?: string;
  deleted?: boolean;
  onReply?: () => void;
  /** Respuestas y composer de respuesta, con sangría bajo el comentario. */
  children?: ReactNode;
  /** Componente de enlace de la app (por ejemplo `next/link`). */
  linkComponent?: ElementType;
}

export const CommentItem = ({
  author,
  createdAt,
  text,
  deleted = false,
  onReply,
  children,
  linkComponent = "a",
}: CommentItemProps) => (
  <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
    <Avatar src={author.image} alt={author.name} sx={{ width: 32, height: 32 }}>
      {author.name.charAt(0)}
    </Avatar>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box
        sx={{
          px: 1.75,
          py: 1.25,
          borderRadius: 3,
          bgcolor: "rgba(255, 255, 255, 0.04)",
          border: 1,
          borderColor: "divider",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "baseline", minWidth: 0 }}
        >
          <Typography noWrap sx={{ fontWeight: 600, fontSize: 14 }}>
            {author.href ? (
              <Link
                component={linkComponent}
                href={author.href}
                color="inherit"
                underline="hover"
              >
                {author.name}
              </Link>
            ) : (
              author.name
            )}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flexShrink: 0 }}
          >
            <RelativeTime date={createdAt} />
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          sx={{
            mt: 0.25,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            lineHeight: 1.6,
            ...(deleted && { color: "text.secondary", fontStyle: "italic" }),
          }}
        >
          {deleted ? "Comentario eliminado" : text}
        </Typography>
      </Box>
      {onReply && !deleted && (
        <Button
          size="small"
          onClick={onReply}
          sx={{ mt: 0.25, minWidth: 0, color: "text.secondary", fontSize: 13 }}
        >
          Responder
        </Button>
      )}
      {children && (
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {children}
        </Stack>
      )}
    </Box>
  </Stack>
);
