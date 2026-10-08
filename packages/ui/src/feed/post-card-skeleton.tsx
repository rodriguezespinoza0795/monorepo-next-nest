import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

export const PostCardSkeleton = () => (
  <Card aria-hidden sx={{ p: { xs: 2.5, sm: 3 } }}>
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <Skeleton width="40%" />
        <Skeleton width="25%" />
      </Box>
    </Stack>
    <Skeleton />
    <Skeleton />
    <Skeleton width="70%" />
  </Card>
);
