"use client";

import type { FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { MentionTextField, type MentionUser } from "./mention-text-field";

interface InlineEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  label: string;
  saving?: boolean;
  error?: string | null;
  maxLength?: number;
  minRows?: number;
  mentionSuggestions?: MentionUser[];
  onMentionQuery?: (query: string | null) => void;
  onMention?: (user: MentionUser) => void;
}

/** Edición en el lugar de un texto (publicación o comentario). */
export const InlineEditor = ({
  value,
  onChange,
  onSave,
  onCancel,
  label,
  saving = false,
  error,
  maxLength,
  minRows = 2,
  mentionSuggestions = [],
  onMentionQuery = () => {},
  onMention = () => {},
}: InlineEditorProps) => {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!saving) onSave();
  };

  return (
    <Stack component="form" onSubmit={submit} spacing={1}>
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
          if (event.key === "Escape") onCancel();
        }}
        multiline
        minRows={minRows}
        fullWidth
        autoFocus
        disabled={saving}
        slotProps={{ htmlInput: { maxLength, "aria-label": label } }}
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        <Button size="small" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          type="submit"
          size="small"
          variant="contained"
          disabled={saving}
          startIcon={
            saving ? <CircularProgress size={14} color="inherit" /> : undefined
          }
        >
          Guardar
        </Button>
      </Stack>
    </Stack>
  );
};
