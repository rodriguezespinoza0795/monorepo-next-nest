"use client";

import { Fragment, type ElementType, type ReactNode } from "react";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";

export interface Mention {
  name: string;
  href?: string;
}

// `[texto](https://…)` o una URL suelta. Solo http(s): nada de `javascript:`.
const LINKS =
  /\[([^\]\n]{1,200})\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"]+)/g;
// Puntuación que suele ir pegada al final de una URL y no es parte de ella.
const TRAILING = /[.,;:!?)\]]+$/;

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
};

/** Enlace externo seguro: pestaña nueva, sin referer ni autoridad SEO. */
const ExternalLink = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => {
  const host = hostOf(href);
  if (!host) return <>{children}</>;
  return (
    // El dominio real a la vista: un texto de enlace puede decir cualquier cosa.
    // `describeChild`: el dominio es una descripción; el nombre del enlace
    // sigue siendo su texto (lo que leen los lectores de pantalla).
    <Tooltip title={`Abre ${host}`} placement="top" describeChild>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        underline="always"
        sx={{ color: "primary.light", overflowWrap: "anywhere" }}
      >
        {children}
      </Link>
    </Tooltip>
  );
};

const renderMentions = (
  text: string,
  mentions: Mention[],
  linkComponent: ElementType,
  keyPrefix: string,
) => {
  if (mentions.length === 0) return [text];
  // Nombres más largos primero para que "@Ana María" gane a "@Ana".
  const byName = new Map(mentions.map((mention) => [mention.name, mention]));
  const names = [...byName.keys()].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(@(?:${names.map(escape).join("|")}))`, "g");
  return text.split(pattern).map((part, index) => {
    const mention = part.startsWith("@")
      ? byName.get(part.slice(1))
      : undefined;
    if (!mention)
      return <Fragment key={`${keyPrefix}-${index}`}>{part}</Fragment>;
    return (
      <Link
        key={`${keyPrefix}-${index}`}
        component={mention.href ? linkComponent : "span"}
        href={mention.href}
        underline="hover"
        sx={{ color: "primary.light", fontWeight: 600 }}
      >
        {part}
      </Link>
    );
  });
};

/** Texto de un post o comentario: enlaces, URLs y @menciones. */
export const RichText = ({
  text,
  mentions = [],
  linkComponent = "a",
}: {
  text: string;
  mentions?: Mention[];
  linkComponent?: ElementType;
}) => {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINKS)) {
    const [whole, label, labelledUrl, bareUrl] = match;
    const start = match.index;
    let end = start + whole.length;
    let url = labelledUrl;
    if (bareUrl) {
      url = bareUrl.replace(TRAILING, "");
      end = start + url.length;
    }
    nodes.push(
      ...renderMentions(
        text.slice(last, start),
        mentions,
        linkComponent,
        `t${start}`,
      ),
    );
    nodes.push(
      <ExternalLink key={`l${start}`} href={url as string}>
        {label ?? url}
      </ExternalLink>,
    );
    last = end;
  }
  nodes.push(
    ...renderMentions(text.slice(last), mentions, linkComponent, "end"),
  );
  return <>{nodes}</>;
};

/** Texto plano (notificaciones, extractos): `[texto](url)` → `texto`. */
export const plainText = (text: string) =>
  text.replace(/\[([^\]\n]{1,200})\]\((https?:\/\/[^\s)]+)\)/g, "$1");
