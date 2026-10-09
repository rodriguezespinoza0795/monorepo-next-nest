"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import BookmarkRemoveOutlinedIcon from "@mui/icons-material/BookmarkRemoveOutlined";
import { useFeedsClient } from "@stream-io/feeds-react-sdk";
import { plainText } from "@repo/ui/feed/rich-text";
import { PostResult } from "@repo/ui/feed/search-results";
import { postHref } from "../../../lib/routes";

export interface SavedPost {
  id: string;
  text: string;
  createdAt: string;
  author: { name: string; image?: string };
  space?: string;
  imageCount: number;
}

// Lista de guardados: cada uno enlaza al post y se puede quitar (bookmark
// directo con el SDK; después se recarga la lista del servidor).
export const SavedList = ({ posts }: { posts: SavedPost[] }) => {
  const client = useFeedsClient();
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const remove = async (id: string) => {
    if (!client) return;
    setRemoving(id);
    setError(null);
    try {
      await client.deleteBookmark({ activity_id: id });
      startTransition(() => router.refresh());
    } catch {
      setError("No pudimos quitarla de guardados. Inténtalo de nuevo.");
      setRemoving(null);
    }
  };

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {posts.map((post) => (
        <Stack key={post.id} spacing={0.75}>
          <PostResult
            href={postHref(post.id)}
            author={post.author}
            space={post.space}
            createdAt={new Date(post.createdAt)}
            text={plainText(post.text)}
            query=""
            imageCount={post.imageCount}
            linkComponent={Link}
          />
          <Button
            size="small"
            onClick={() => void remove(post.id)}
            disabled={removing === post.id}
            startIcon={<BookmarkRemoveOutlinedIcon />}
            sx={{ alignSelf: "flex-start", color: "text.secondary" }}
          >
            Quitar de guardados
          </Button>
        </Stack>
      ))}
    </Stack>
  );
};
