import type { ReactNode } from "react";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export const EmptyState = ({ icon, title, description }: EmptyStateProps) => (
  <Card sx={{ px: 3, py: 6 }}>
    <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center" }}>
      {icon && (
        <Stack sx={{ color: "primary.light", fontSize: 40 }}>{icon}</Stack>
      )}
      <Typography variant="h3">{title}</Typography>
      {description && (
        <Typography color="text.secondary" sx={{ maxWidth: 360 }}>
          {description}
        </Typography>
      )}
    </Stack>
  </Card>
);
