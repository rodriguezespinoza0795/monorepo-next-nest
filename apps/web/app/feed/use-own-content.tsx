"use client";

import { useState } from "react";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { ConfirmDialog } from "@repo/ui/confirm-dialog";
import { InlineEditor } from "@repo/ui/feed/inline-editor";
import { ItemMenu } from "@repo/ui/feed/item-menu";
import type { MentionUser } from "@repo/ui/feed/mention-text-field";
import type { ActionResult } from "./actions";
import { useMentions } from "./use-mentions";

const FAILED: ActionResult = {
  ok: false,
  error: "No pudimos completar la acción. Inténtalo de nuevo.",
};

interface OwnContentOptions {
  kind: "post" | "comment";
  text: string;
  mentions: MentionUser[];
  maxLength: number;
  save: (text: string, mentionedUserIds: string[]) => Promise<ActionResult>;
  remove: () => Promise<ActionResult>;
  /** Tras guardar (por ejemplo, recargar el feed o el detalle). */
  onSaved?: () => void | Promise<void>;
  /** Tras eliminar. */
  onDeleted?: () => void | Promise<void>;
}

// Editar y eliminar lo propio: devuelve el menú "⋯", el editor en el lugar
// (mientras se edita) y el diálogo de confirmación para eliminar.
export const useOwnContent = ({
  kind,
  text,
  mentions: initialMentions,
  maxLength,
  save,
  remove,
  onSaved,
  onDeleted,
}: OwnContentOptions) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const mentions = useMentions(initialMentions);
  const noun = kind === "post" ? "publicación" : "comentario";

  const startEditing = () => {
    setDraft(text);
    mentions.reset(initialMentions);
    setError(null);
    setEditing(true);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const result = await save(draft, mentions.mentionedIds(draft)).catch(
      () => FAILED,
    );
    if (result.ok) {
      await onSaved?.();
      setEditing(false);
    } else {
      setError(result.error);
    }
    setSaving(false);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const result = await remove().catch(() => FAILED);
    setDeleting(false);
    setConfirming(false);
    if (result.ok) await onDeleted?.();
    else setError(result.error);
  };

  return {
    menu: (
      <ItemMenu
        label={
          kind === "post"
            ? "Opciones de la publicación"
            : "Opciones del comentario"
        }
        actions={[
          {
            label: "Editar",
            icon: <EditOutlinedIcon fontSize="small" />,
            onClick: startEditing,
          },
          {
            label: "Eliminar",
            icon: <DeleteOutlineOutlinedIcon fontSize="small" />,
            onClick: () => setConfirming(true),
            destructive: true,
          },
        ]}
      />
    ),
    editor: editing ? (
      <InlineEditor
        value={draft}
        onChange={setDraft}
        onSave={() => void submit()}
        onCancel={() => setEditing(false)}
        label={kind === "post" ? "Editar publicación" : "Editar comentario"}
        saving={saving}
        error={error}
        maxLength={maxLength}
        minRows={kind === "post" ? 3 : 1}
        mentionSuggestions={mentions.suggestions}
        onMentionQuery={mentions.onMentionQuery}
        onMention={mentions.onMention}
      />
    ) : undefined,
    /** Error al eliminar (cuando no se está editando). */
    error: editing ? null : error,
    dialog: (
      <ConfirmDialog
        open={confirming}
        title={`¿Eliminar ${kind === "post" ? "tu publicación" : "tu comentario"}?`}
        description={
          kind === "post"
            ? "Desaparece de su espacio, del Inicio de los miembros y de tu perfil."
            : "Desaparece del hilo. Sus respuestas se mantienen."
        }
        confirmLabel={`Eliminar ${noun}`}
        destructive
        loading={deleting}
        onClose={() => setConfirming(false)}
        onConfirm={() => void confirmDelete()}
      />
    ),
  };
};
