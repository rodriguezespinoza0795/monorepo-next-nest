import { Fragment, type ElementType } from "react";
import Link from "@mui/material/Link";

export interface Mention {
  name: string;
  href?: string;
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Texto con las @menciones resaltadas (y enlazadas al perfil si hay `href`).
export const MentionText = ({
  text,
  mentions = [],
  linkComponent = "a",
}: {
  text: string;
  mentions?: Mention[];
  linkComponent?: ElementType;
}) => {
  if (mentions.length === 0) return <>{text}</>;

  // Nombres más largos primero para que "@Ana María" gane a "@Ana".
  const byName = new Map(mentions.map((mention) => [mention.name, mention]));
  const names = [...byName.keys()].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(@(?:${names.map(escape).join("|")}))`, "g");

  return (
    <>
      {text.split(pattern).map((part, index) => {
        const mention = part.startsWith("@")
          ? byName.get(part.slice(1))
          : undefined;
        if (!mention) return <Fragment key={index}>{part}</Fragment>;
        return (
          <Link
            key={index}
            component={mention.href ? linkComponent : "span"}
            href={mention.href}
            underline="hover"
            sx={{ color: "primary.light", fontWeight: 600 }}
          >
            {part}
          </Link>
        );
      })}
    </>
  );
};
