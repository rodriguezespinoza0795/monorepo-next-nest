"use client";

import { useRef, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

export interface ComposerImage {
  id: string;
  /** URL de vista previa (local mientras sube). */
  previewUrl: string;
  uploading: boolean;
}

interface PostComposerProps {
  user: { name: string; image?: string };
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  maxLength?: number;
  /** Si hay más de uno, se muestra un selector de espacio. */
  spaces?: { id: string; name: string }[];
  spaceId?: string;
  onSpaceChange?: (spaceId: string) => void;
  images?: ComposerImage[];
  maxImages?: number;
  onAddImages?: (files: File[]) => void;
  onRemoveImage?: (id: string) => void;
  submitting?: boolean;
  error?: string | null;
}

export const PostComposer = ({
  user,
  value,
  onChange,
  onSubmit,
  placeholder = "¿Qué quieres compartir?",
  maxLength,
  spaces = [],
  spaceId,
  onSpaceChange,
  images = [],
  maxImages = 4,
  onAddImages,
  onRemoveImage,
  submitting = false,
  error,
}: PostComposerProps) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const uploading = images.some((image) => image.uploading);
  const empty = !value.trim() && images.length === 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!empty && !uploading && !submitting) onSubmit();
  };

  return (
    <Card component="form" onSubmit={submit} sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack direction="row" spacing={1.5}>
        <Avatar
          src={user.image}
          alt={user.name}
          sx={{ display: { xs: "none", sm: "flex" } }}
        >
          {user.name.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <TextField
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                submit(event);
              }
            }}
            placeholder={placeholder}
            multiline
            minRows={2}
            fullWidth
            disabled={submitting}
            slotProps={{
              htmlInput: { maxLength, "aria-label": "Escribe tu publicación" },
            }}
          />

          {images.length > 0 && (
            <Box
              sx={{
                mt: 1.5,
                display: "grid",
                gap: 1,
                gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
              }}
            >
              {images.map((image) => (
                <Box
                  key={image.id}
                  sx={{ position: "relative", aspectRatio: "1" }}
                >
                  <Box
                    component="img"
                    src={image.previewUrl}
                    alt=""
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: 2,
                      opacity: image.uploading ? 0.5 : 1,
                    }}
                  />
                  {image.uploading && (
                    <CircularProgress
                      size={24}
                      aria-label="Subiendo imagen"
                      sx={{ position: "absolute", inset: 0, m: "auto" }}
                    />
                  )}
                  {onRemoveImage && (
                    <IconButton
                      size="small"
                      aria-label="Quitar imagen"
                      onClick={() => onRemoveImage(image.id)}
                      disabled={submitting}
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        bgcolor: "rgba(4, 6, 14, 0.75)",
                        "&:hover": { bgcolor: "rgba(4, 6, 14, 0.9)" },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {error}
            </Alert>
          )}

          <Stack
            direction="row"
            spacing={1}
            sx={{ mt: 1.5, alignItems: "center", flexWrap: "wrap", rowGap: 1 }}
          >
            {onAddImages && (
              <>
                <Tooltip title={`Agregar imágenes (máx. ${maxImages})`}>
                  <span>
                    <IconButton
                      aria-label="Agregar imágenes"
                      onClick={() => fileInput.current?.click()}
                      disabled={submitting || images.length >= maxImages}
                      sx={{ color: "primary.light" }}
                    >
                      <ImageOutlinedIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (files.length) onAddImages(files);
                    event.target.value = "";
                  }}
                />
              </>
            )}

            {spaces.length > 1 && onSpaceChange && (
              <TextField
                select
                size="small"
                value={spaceId ?? ""}
                onChange={(event) => onSpaceChange(event.target.value)}
                disabled={submitting}
                slotProps={{ htmlInput: { "aria-label": "Espacio" } }}
                sx={{ minWidth: 140 }}
              >
                {spaces.map((space) => (
                  <MenuItem key={space.id} value={space.id}>
                    # {space.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={empty || uploading || submitting}
              startIcon={
                submitting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
              sx={{ ml: "auto !important" }}
            >
              Publicar
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Card>
  );
};
