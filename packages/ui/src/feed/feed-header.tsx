import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

// Título y descripción de una página del feed, con una acción opcional.
export const FeedHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <Stack
    direction="row"
    spacing={2}
    sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="h2"
        component="h1"
        sx={{ fontSize: { xs: "1.75rem", sm: "2rem" } }}
      >
        {title}
      </Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Box>
    {action}
  </Stack>
);
