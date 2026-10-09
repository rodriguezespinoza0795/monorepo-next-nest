"use client";

import { useId, useState, type FormEvent } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import LinkIcon from "@mui/icons-material/Link";

// Solo enlaces web; si falta el esquema se asume https.
const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
};

/**
 * Botón "Insertar enlace": pide texto y URL y devuelve `[texto](url)` (o la
 * URL sola si no hay texto) para insertarlo en el editor.
 */
export const InsertLinkButton = ({
  onInsert,
  disabled = false,
  size = "medium",
}: {
  onInsert: (markdown: string) => void;
  disabled?: boolean;
  size?: "small" | "medium";
}) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  const close = () => {
    setOpen(false);
    setText("");
    setUrl("");
    setError(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // El diálogo vive en un portal, pero en React sigue dentro del formulario
    // del composer: sin esto, "Insertar" también publicaría el post.
    event.stopPropagation();
    const href = normalizeUrl(url);
    if (!href) {
      setError("Escribe una dirección web válida, por ejemplo ejemplo.com");
      return;
    }
    const label = text.replace(/[[\]\n]/g, "").trim();
    onInsert(label ? `[${label}](${href})` : href);
    close();
  };

  return (
    <>
      <Tooltip title="Insertar enlace">
        <span>
          <IconButton
            aria-label="Insertar enlace"
            onClick={() => setOpen(true)}
            disabled={disabled}
            size={size}
            sx={{ color: "primary.light" }}
          >
            <LinkIcon fontSize={size === "small" ? "small" : "medium"} />
          </IconButton>
        </span>
      </Tooltip>
      <Dialog
        open={open}
        onClose={close}
        fullWidth
        maxWidth="xs"
        aria-labelledby={titleId}
        slotProps={{
          paper: {
            component: "form",
            onSubmit: submit,
            sx: {
              bgcolor: "background.paper",
              backgroundImage: "none",
              border: 1,
              borderColor: "divider",
              borderRadius: 4,
            },
          } as object,
        }}
      >
        <DialogTitle id={titleId} sx={{ fontWeight: 700 }}>
          Insertar enlace
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Texto (opcional)"
              value={text}
              onChange={(event) => setText(event.target.value)}
              helperText="Lo que se verá en lugar de la dirección."
              autoFocus
              fullWidth
              slotProps={{ htmlInput: { maxLength: 200 } }}
            />
            <TextField
              label="Dirección (URL)"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setError(null);
              }}
              placeholder="https://"
              error={Boolean(error)}
              helperText={error ?? " "}
              required
              fullWidth
              slotProps={{ htmlInput: { inputMode: "url" } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={close}>Cancelar</Button>
          <Button type="submit" variant="contained">
            Insertar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
