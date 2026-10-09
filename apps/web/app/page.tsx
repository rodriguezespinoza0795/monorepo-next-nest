import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BRAND } from "@repo/community/brand";
import { SiteFooter } from "@repo/ui/site-footer";
import { SiteHeader } from "@repo/ui/site-header";

const steps = [
  {
    title: "Entra con Google",
    description:
      "Sin contraseñas nuevas: inicias sesión con tu cuenta de Google en un clic.",
  },
  {
    title: "Únete a los espacios",
    description:
      "Elige los espacios que te interesan; su actividad llega a tu Inicio.",
  },
  {
    title: "Publica y conversa",
    description:
      "Comparte texto e imágenes, comenta, menciona con @ y recibe avisos cuando alguien te responde.",
  },
];

const accentGlow =
  "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99, 102, 241, 0.22), transparent 70%)";
const violetGlow =
  "radial-gradient(ellipse 40% 35% at 80% 75%, rgba(139, 92, 246, 0.14), transparent 70%)";
const dotGrid =
  "radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)";

export default function Home() {
  return (
    <>
      <SiteHeader
        brand={BRAND.name}
        links={[
          { label: "Cómo funciona", href: "#como-funciona" },
          { label: "Únete", href: "#unete" },
        ]}
        action={{ label: "Acceder", href: "/login" }}
      />

      <Box component="main">
        <Box
          component="section"
          sx={{
            position: "relative",
            minHeight: "100svh",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            backgroundImage: `${accentGlow}, ${violetGlow}, ${dotGrid}`,
            backgroundSize: "100% 100%, 100% 100%, 28px 28px",
          }}
        >
          <Container maxWidth="md" sx={{ py: { xs: 14, sm: 16 } }}>
            <Stack
              spacing={4}
              sx={{ alignItems: "center", textAlign: "center" }}
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
                    <span>Demo • Construida con Stream Activity Feeds</span>
                  </Stack>
                }
                sx={{ fontWeight: 500, px: 1, height: 36 }}
              />

              <Typography variant="h1">
                Comparte, pregunta y aprende en comunidad
              </Typography>

              <Typography variant="subtitle1" sx={{ maxWidth: 560 }}>
                {BRAND.name} reúne a personas con intereses en común en espacios
                temáticos. Publica tus avances, haz preguntas y conversa con
                quienes están en lo mismo que tú.
              </Typography>

              <Button variant="contained" size="large" href="/login">
                Únete con Google →
              </Button>
            </Stack>
          </Container>
        </Box>

        <Box
          component="section"
          id="como-funciona"
          sx={{ py: { xs: 10, sm: 14 }, scrollMarginTop: 64 }}
        >
          <Container maxWidth="lg">
            <Stack
              spacing={2}
              sx={{ mb: 6, textAlign: "center", alignItems: "center" }}
            >
              <Typography variant="h2">Cómo funciona</Typography>
              <Typography variant="subtitle1" sx={{ maxWidth: 560 }}>
                Tres pasos para empezar a participar.
              </Typography>
            </Stack>

            <Grid container spacing={3}>
              {steps.map((step, index) => (
                <Grid key={step.title} size={{ xs: 12, md: 4 }}>
                  <Card sx={{ height: "100%" }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography
                        sx={{
                          fontFamily: "var(--font-montserrat)",
                          fontWeight: 700,
                          color: "primary.light",
                          mb: 2,
                        }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </Typography>
                      <Typography variant="h3" gutterBottom>
                        {step.title}
                      </Typography>
                      <Typography color="text.secondary">
                        {step.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        <Box
          component="section"
          id="unete"
          sx={{ pb: { xs: 10, sm: 14 }, scrollMarginTop: 64 }}
        >
          <Container maxWidth="md">
            <Card
              sx={{
                textAlign: "center",
                backgroundImage: accentGlow,
                px: { xs: 3, sm: 8 },
                py: { xs: 6, sm: 8 },
              }}
            >
              <Typography variant="h2" gutterBottom>
                Tu lugar en la comunidad
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ maxWidth: 480, mx: "auto", mb: 4 }}
              >
                Es gratis. Es una demo: el contenido puede borrarse en cualquier
                momento, y un equipo de moderación cuida las conversaciones.
              </Typography>
              <Button variant="contained" size="large" href="/login">
                Crear mi cuenta
              </Button>
            </Card>
          </Container>
        </Box>
      </Box>

      <SiteFooter
        brand={BRAND.name}
        note={BRAND.demoNote}
        links={[
          { label: "Privacidad", href: "/privacy" },
          { label: "Condiciones", href: "/terms" },
        ]}
      />
    </>
  );
}
