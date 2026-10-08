"use client";

import type { ReactNode } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  /** Acción irreversible o delicada: el botón se muestra en rojo. */
  destructive?: boolean;
  loading?: boolean;
  /** Campos extra (por ejemplo, un motivo). */
  children?: ReactNode;
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  destructive = false,
  loading = false,
  children,
}: ConfirmDialogProps) => (
  <Dialog
    open={open}
    onClose={loading ? undefined : onClose}
    fullWidth
    maxWidth="xs"
    slotProps={{
      paper: {
        sx: {
          bgcolor: "background.paper",
          backgroundImage: "none",
          border: 1,
          borderColor: "divider",
          borderRadius: 4,
        },
      },
    }}
  >
    <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText sx={{ color: "text.secondary" }}>
        {description}
      </DialogContentText>
      {children}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5 }}>
      <Button onClick={onClose} disabled={loading}>
        Cancelar
      </Button>
      <Button
        variant="contained"
        color={destructive ? "error" : "primary"}
        onClick={onConfirm}
        disabled={loading}
        startIcon={
          loading ? <CircularProgress size={16} color="inherit" /> : undefined
        }
        sx={
          destructive
            ? { backgroundImage: "none", boxShadow: "none" }
            : undefined
        }
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);
