"use client";

import { useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import BlockIcon from "@mui/icons-material/Block";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import RestoreIcon from "@mui/icons-material/Restore";
import { ConfirmDialog } from "@repo/ui/confirm-dialog";
import {
  banUser,
  deleteComment,
  deletePost,
  purgePost,
  restorePost,
  unbanUser,
  type ModerationResult,
} from "./actions";

type Dialog = "delete" | "ban" | null;

const useAction = () => {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const execute = (
    action: () => Promise<ModerationResult>,
    onDone: () => void,
  ) =>
    startTransition(async () => {
      setError(null);
      try {
        const result = await action();
        if (result.ok) onDone();
        else setError(result.error);
      } catch {
        setError("No tienes permiso o tu sesión expiró.");
      }
    });
  return { pending, error, execute };
};

const actionSx = { color: "text.secondary", fontWeight: 500 } as const;

/** Eliminar un post o comentario y, si aplica, bloquear a su autor. */
export const ModerationButtons = ({
  target,
  id,
  author,
}: {
  target: "post" | "comment";
  id: string;
  /** Autor bloqueable (se omite para el sistema o para uno mismo). */
  author?: { id: string; name: string };
}) => {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reason, setReason] = useState("");
  const { pending, error, execute } = useAction();
  const close = () => setDialog(null);
  const noun = target === "post" ? "publicación" : "comentario";

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <Button
          size="small"
          startIcon={<DeleteOutlineIcon />}
          onClick={() => setDialog("delete")}
          sx={actionSx}
        >
          Eliminar {noun}
        </Button>
        {author && (
          <Button
            size="small"
            startIcon={<BlockIcon />}
            onClick={() => setDialog("ban")}
            sx={actionSx}
          >
            Bloquear a {author.name}
          </Button>
        )}
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}

      <ConfirmDialog
        open={dialog === "delete"}
        title={`¿Eliminar ${target === "post" ? "esta publicación" : "este comentario"}?`}
        description={
          target === "post"
            ? "Desaparece de todos los espacios, del Inicio de los miembros y del perfil del autor."
            : "Desaparece del hilo. Sus respuestas se mantienen."
        }
        confirmLabel="Eliminar"
        destructive
        loading={pending}
        onClose={close}
        onConfirm={() =>
          execute(
            () => (target === "post" ? deletePost(id) : deleteComment(id)),
            close,
          )
        }
      />

      {author && (
        <ConfirmDialog
          open={dialog === "ban"}
          title={`¿Bloquear a ${author.name}?`}
          description="No podrá leer, publicar, comentar ni reaccionar en la comunidad hasta que lo desbloquees. Su contenido actual no se borra."
          confirmLabel="Bloquear"
          destructive
          loading={pending}
          onClose={close}
          onConfirm={() =>
            execute(
              () => banUser(author.id, reason),
              () => {
                setReason("");
                close();
              },
            )
          }
        >
          <TextField
            label="Motivo (opcional)"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            fullWidth
            multiline
            minRows={2}
            slotProps={{ htmlInput: { maxLength: 300 } }}
            sx={{ mt: 2 }}
          />
        </ConfirmDialog>
      )}
    </Stack>
  );
};

export const UnbanButton = ({ id, name }: { id: string; name: string }) => {
  const [open, setOpen] = useState(false);
  const { pending, error, execute } = useAction();

  return (
    <Stack spacing={1} sx={{ alignItems: "flex-end" }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<LockOpenIcon />}
        onClick={() => setOpen(true)}
      >
        Desbloquear
      </Button>
      {error && <Alert severity="error">{error}</Alert>}
      <ConfirmDialog
        open={open}
        title={`¿Desbloquear a ${name}?`}
        description="Podrá volver a leer, publicar, comentar y reaccionar."
        confirmLabel="Desbloquear"
        loading={pending}
        onClose={() => setOpen(false)}
        onConfirm={() =>
          execute(
            () => unbanUser(id),
            () => setOpen(false),
          )
        }
      />
    </Stack>
  );
};

/** Restaurar o borrar para siempre una publicación eliminada. */
export const DeletedPostButtons = ({ id }: { id: string }) => {
  const [dialog, setDialog] = useState<"restore" | "purge" | null>(null);
  const { pending, error, execute } = useAction();
  const close = () => setDialog(null);

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <Button
          size="small"
          startIcon={<RestoreIcon />}
          onClick={() => setDialog("restore")}
          sx={actionSx}
        >
          Restaurar
        </Button>
        <Button
          size="small"
          startIcon={<DeleteForeverOutlinedIcon />}
          onClick={() => setDialog("purge")}
          sx={actionSx}
        >
          Eliminar definitivamente
        </Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}

      <ConfirmDialog
        open={dialog === "restore"}
        title="¿Restaurar esta publicación?"
        description="Vuelve a sus espacios, al Inicio de los miembros y al perfil del autor, con sus comentarios."
        confirmLabel="Restaurar"
        loading={pending}
        onClose={close}
        onConfirm={() => execute(() => restorePost(id), close)}
      />
      <ConfirmDialog
        open={dialog === "purge"}
        title="¿Eliminar para siempre?"
        description="La publicación y sus comentarios se borran de Stream y no se podrán recuperar."
        confirmLabel="Eliminar para siempre"
        destructive
        loading={pending}
        onClose={close}
        onConfirm={() => execute(() => purgePost(id), close)}
      />
    </Stack>
  );
};
