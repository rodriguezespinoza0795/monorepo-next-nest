import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SiteFooter } from "@repo/ui/site-footer";
import { SiteHeader } from "@repo/ui/site-header";
import { ADMIN_BRAND } from "@repo/community/brand";

// Secciones reales del panel (sin sesión, el panel redirige al login).
const sections = [
  {
    title: "Publicaciones",
    description:
      "Lo más reciente de todos los espacios: elimina contenido o bloquea a su autor.",
    href: "/moderacion",
  },
  {
    title: "Buscar",
    description:
      "Encuentra publicaciones y miembros, también los bloqueados, y revisa todo lo de un autor.",
    href: "/moderacion/buscar",
  },
  {
    title: "Eliminadas",
    description:
      "Publicaciones borradas por sus autores o por moderación: restáuralas o elimínalas para siempre.",
    href: "/moderacion/eliminadas",
  },
  {
    title: "Bloqueados",
    description:
      "Miembros bloqueados de la comunidad; desbloquéalos cuando proceda.",
    href: "/moderacion/bloqueados",
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
        brand={ADMIN_BRAND}
        action={{ label: "Acceder", href: "/login" }}
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
              Modera las publicaciones y los miembros de la comunidad desde un
              solo lugar.
            </Typography>

            <Button variant="contained" size="large" href="/moderacion">
              Acceder al panel →
            </Button>
          </Stack>

          <Grid container spacing={3}>
            {sections.map((section) => (
              <Grid key={section.title} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: "100%" }}>
                  <CardActionArea
                    href={section.href}
                    sx={{ height: "100%", alignItems: "flex-start" }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h3" gutterBottom>
                        {section.title}
                      </Typography>
                      <Typography color="text.secondary">
                        {section.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      <SiteFooter brand={ADMIN_BRAND} />
    </>
  );
}
