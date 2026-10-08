import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SiteHeader } from "@repo/ui/site-header";

const sections = [
  {
    title: "Usuarios",
    description: "Gestiona cuentas, roles y permisos de acceso.",
  },
  {
    title: "Contenido",
    description: "Revisa, publica y organiza la información del sitio.",
  },
  {
    title: "Configuración",
    description: "Ajusta las preferencias generales de la plataforma.",
  },
];

const accentGlow =
  "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99, 102, 241, 0.22), transparent 70%)";
const dotGrid =
  "radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)";

export default function Home() {
  return (
    <>
      <SiteHeader
        brand="getStream Admin"
        action={{ label: "Acceder", href: "#" }}
      />

      <Box
        component="main"
        sx={{
          minHeight: "100svh",
          backgroundImage: `${accentGlow}, ${dotGrid}`,
          backgroundSize: "100% 100%, 28px 28px",
          backgroundRepeat: "no-repeat, repeat",
        }}
      >
        <Container maxWidth="lg" sx={{ pt: { xs: 16, sm: 20 }, pb: 10 }}>
          <Stack
            spacing={3}
            sx={{ alignItems: "center", textAlign: "center", mb: 8 }}
          >
            <Chip
              variant="outlined"
              label={
                <Stack
                  component="span"
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                    }}
                  />
                  <span>Panel de administración</span>
                </Stack>
              }
              sx={{ fontWeight: 500, px: 1, height: 36 }}
            />

            <Typography variant="h1">Bienvenido</Typography>

            <Typography variant="subtitle1" sx={{ maxWidth: 520 }}>
              Administra los usuarios, el contenido y la configuración de la
              plataforma desde un solo lugar.
            </Typography>

            <Button variant="contained" size="large" href="#">
              Acceder al panel →
            </Button>
          </Stack>

          <Grid container spacing={3}>
            {sections.map((section) => (
              <Grid key={section.title} size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h3" gutterBottom>
                      {section.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {section.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </>
  );
}
