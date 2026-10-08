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

const steps = [
  {
    title: "Conecta tus fuentes",
    description:
      "Integra los datos que ya tienes en minutos, sin cambiar tu forma de trabajar.",
  },
  {
    title: "Recibe señales claras",
    description:
      "Procesamos la información y la convertimos en avisos fáciles de entender.",
  },
  {
    title: "Actúa a tiempo",
    description:
      "Da seguimiento a cada caso y comparte el contexto con tu equipo.",
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
        brand="getStream"
        links={[
          { label: "Cómo funciona", href: "#como-funciona" },
          { label: "Contacto", href: "#contacto" },
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
                    <span>Plataforma en desarrollo • Versión preliminar</span>
                  </Stack>
                }
                sx={{ fontWeight: 500, px: 1, height: 36 }}
              />

              <Typography variant="h1">
                Información clara para decidir mejor
              </Typography>

              <Typography variant="subtitle1" sx={{ maxWidth: 560 }}>
                Reunimos datos dispersos y los convertimos en señales
                comprensibles para facilitar el análisis, el seguimiento y la
                respuesta de tu equipo.
              </Typography>

              <Button variant="contained" size="large" href="#como-funciona">
                Empezar ahora →
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
                Tres pasos para pasar de los datos a la acción.
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
          id="contacto"
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
                Trabajemos juntos
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ maxWidth: 480, mx: "auto", mb: 4 }}
              >
                Cuéntanos qué necesitas y te ayudamos a ponerlo en marcha.
              </Typography>
              <Button variant="contained" size="large" href="#">
                Contactar
              </Button>
            </Card>
          </Container>
        </Box>
      </Box>

      <Box
        component="footer"
        sx={{ borderTop: 1, borderColor: "divider", py: 4 }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} getStream
          </Typography>
        </Container>
      </Box>
    </>
  );
}
