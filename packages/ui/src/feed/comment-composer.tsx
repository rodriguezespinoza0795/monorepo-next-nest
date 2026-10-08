"use client";

import type { FormEvent } from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { MentionTextField, type MentionUser } from "./mention-text-field";

interface CommentComposerProps {
  user: { name: string; image?: string };
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  submitting?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  /** Autocompletado de @menciones. */
  mentionSuggestions?: MentionUser[];
  onMentionQuery?: (query: string | null) => void;
  onMention?: (user: MentionUser) => void;
}

export const CommentComposer = ({
  user,
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = "Escribe un comentario…",
  submitLabel = "Comentar",
  submitting = false,
  autoFocus,
  maxLength,
  mentionSuggestions = [],
  onMentionQuery = () => {},
  onMention = () => {},
}: CommentComposerProps) => {
  const empty = !value.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!empty && !submitting) onSubmit();
  };

  return (
    <Stack
      component="form"
      onSubmit={submit}
      direction="row"
      spacing={1.5}
      sx={{ alignItems: "flex-start" }}
    >
      <Avatar src={user.image} alt={user.name} sx={{ width: 32, height: 32 }}>
        {user.name.charAt(0)}
      </Avatar>
      <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
        <MentionTextField
          value={value}
          onChange={onChange}
          suggestions={mentionSuggestions}
          onMentionQuery={onMentionQuery}
          onMention={onMention}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              submit(event);
            }
          }}
          placeholder={placeholder}
          multiline
          minRows={1}
          size="small"
          fullWidth
          autoFocus={autoFocus}
          disabled={submitting}
          slotProps={{ htmlInput: { maxLength, "aria-label": placeholder } }}
        />
        {(!empty || onCancel) && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: "flex-end" }}
          >
            {onCancel && (
              <Button size="small" onClick={onCancel} disabled={submitting}>
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              size="small"
              variant="contained"
              disabled={empty || submitting}
              startIcon={
                submitting ? (
                  <CircularProgress size={14} color="inherit" />
                ) : undefined
              }
            >
              {submitLabel}
            </Button>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};
