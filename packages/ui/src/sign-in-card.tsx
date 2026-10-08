"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import GoogleIcon from "@mui/icons-material/Google";

interface SignInCardProps {
  title: string;
  description: string;
  onGoogleSignIn: () => void;
  loading?: boolean;
  error?: string | null;
}

export const SignInCard = ({
  title,
  description,
  onGoogleSignIn,
  loading = false,
  error,
}: SignInCardProps) => (
  <Card
    sx={{
      width: "100%",
      maxWidth: 420,
      px: { xs: 3, sm: 5 },
      py: { xs: 5, sm: 6 },
      backdropFilter: "blur(12px)",
    }}
  >
    <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          bgcolor: "primary.main",
          boxShadow: "0 0 24px rgba(99, 102, 241, 0.8)",
        }}
      />
      <Stack spacing={1}>
        <Typography variant="h2" component="h1" sx={{ fontSize: "1.9rem" }}>
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ width: "100%", textAlign: "left" }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={loading}
        onClick={onGoogleSignIn}
        startIcon={
          loading ? <CircularProgress size={18} color="inherit" /> : <GoogleIcon />
        }
      >
        Continuar con Google
      </Button>
    </Stack>
  </Card>
);
