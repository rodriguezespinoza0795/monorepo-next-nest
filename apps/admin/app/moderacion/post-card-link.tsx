"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { PostCard } from "@repo/ui/feed/post-card";

// `PostCard` con enlaces de Next (los componentes no se pueden pasar como
// props desde un componente de servidor).
export const PostCardLink = (
  props: Omit<ComponentProps<typeof PostCard>, "linkComponent">,
) => <PostCard {...props} linkComponent={Link} />;
