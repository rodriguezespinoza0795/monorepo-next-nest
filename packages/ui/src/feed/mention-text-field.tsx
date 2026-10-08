"use client";

import {
  useRef,
  useState,
  type KeyboardEvent,
  type ComponentProps,
} from "react";
import Avatar from "@mui/material/Avatar";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import TextField from "@mui/material/TextField";

export interface MentionUser {
  id: string;
  name: string;
  image?: string;
}

// `@` al inicio o tras un espacio, seguido de lo que se va escribiendo.
const MENTION_QUERY = /(^|\s)@([\p{L}\p{N}_.-]{0,30})$/u;

type TextFieldProps = Omit<
  ComponentProps<typeof TextField>,
  "value" | "onChange"
>;

interface MentionTextFieldProps extends TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Sugerencias para la consulta actual (vacío si no hay coincidencias). */
  suggestions: MentionUser[];
  /** Se llama con lo escrito tras `@`, o `null` si no se está mencionando. */
  onMentionQuery: (query: string | null) => void;
  /** Se llama al elegir a alguien (el texto ya incluye `@Nombre `). */
  onMention: (user: MentionUser) => void;
}

// Campo de texto con autocompletado de @menciones: al escribir `@` muestra
// miembros y al elegir uno inserta `@Nombre `.
export const MentionTextField = ({
  value,
  onChange,
  suggestions,
  onMentionQuery,
  onMention,
  onKeyDown,
  ...props
}: MentionTextFieldProps) => {
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState<{ start: number; end: number } | null>(
    null,
  );
  const [highlighted, setHighlighted] = useState(0);
  const open = query !== null && suggestions.length > 0;

  const detect = (text: string, caret: number) => {
    const match = MENTION_QUERY.exec(text.slice(0, caret));
    if (!match) {
      setQuery(null);
      onMentionQuery(null);
      return;
    }
    const typed = match[2] ?? "";
    setQuery({ start: caret - typed.length - 1, end: caret });
    setHighlighted(0);
    onMentionQuery(typed);
  };

  const select = (user: MentionUser) => {
    if (!query) return;
    const inserted = `@${user.name} `;
    const next =
      value.slice(0, query.start) + inserted + value.slice(query.end);
    onChange(next);
    onMention(user);
    setQuery(null);
    onMentionQuery(null);
    const caret = query.start + inserted.length;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(caret, caret);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setHighlighted(
          (current) =>
            (current + step + suggestions.length) % suggestions.length,
        );
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const user = suggestions[highlighted];
        if (user) select(user);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery(null);
        onMentionQuery(null);
        return;
      }
    }
    onKeyDown?.(event);
  };

  return (
    <>
      <TextField
        {...props}
        ref={anchorRef}
        inputRef={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          detect(
            event.target.value,
            event.target.selectionStart ?? event.target.value.length,
          );
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Deja tiempo al clic en una sugerencia antes de cerrar la lista.
          setTimeout(() => {
            setQuery(null);
            onMentionQuery(null);
          }, 150);
        }}
      />
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        sx={{ zIndex: (theme) => theme.zIndex.modal }}
      >
        <Paper
          sx={{
            mt: 0.5,
            minWidth: 240,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            backgroundImage: "none",
          }}
        >
          <MenuList dense aria-label="Personas para mencionar">
            {suggestions.map((user, index) => (
              <MenuItem
                key={user.id}
                selected={index === highlighted}
                // `mousedown` para que no se pierda el foco antes del clic.
                onMouseDown={(event) => {
                  event.preventDefault();
                  select(user);
                }}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar
                    src={user.image}
                    alt={user.name}
                    sx={{ width: 28, height: 28 }}
                  >
                    {user.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={user.name} />
              </MenuItem>
            ))}
          </MenuList>
        </Paper>
      </Popper>
    </>
  );
};
