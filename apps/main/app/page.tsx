import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SiteFooter } from "@repo/ui/site-footer";
import { SiteHeader } from "@repo/ui/site-header";
import { MAIN_BRAND } from "../lib/brand";
import { getSession } from "../lib/session";
import { AccountMenu } from "./account-menu";
import { signOut } from "./actions";

const COMMUNITY_URL =
  process.env.NEXT_PUBLIC_COMMUNITY_URL || "http://localhost:3000";

const accentGlow =
  "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99, 102, 241, 0.22), transparent 70%)";
const violetGlow =
  "radial-gradient(ellipse 40% 35% at 80% 75%, rgba(139, 92, 246, 0.14), transparent 70%)";
const dotGrid =
  "radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)";

export default async function Home() {
  const session = await getSession();
  // Quien entra con enlace mágico no tiene nombre: se usa su correo.
  const name = session?.name || session?.email?.split("@")[0] || "";
  // Solo las cuentas con contraseña llegan sin verificar.
  const unverified = session && session.email && !session.emailVerified;

  return (
    <>
      <SiteHeader
        brand={MAIN_BRAND.name}
        action={session ? undefined : { label: "Acceder", href: "/login" }}
        extra={
          session && (
            <AccountMenu
              name={name}
              email={session.email}
              image={session.image}
            />
          )
        }
      />

      <Box
        component="main"
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
          <Stack spacing={4} sx={{ alignItems: "center", textAlign: "center" }}>
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
                      bgcolor: session ? "success.main" : "primary.main",
                    }}
                  />
                  <span>
                    {session ? "Sesión iniciada" : "Demo • App principal"}
                  </span>
                </Stack>
              }
              sx={{ fontWeight: 500, px: 1, height: 36 }}
            />

            {session ? (
              <>
                <Typography variant="h1">Hola, {name}</Typography>
                <Typography variant="subtitle1" sx={{ maxWidth: 560 }}>
                  Tu sesión vale para toda la familia {MAIN_BRAND.name}: entra a
                  la comunidad sin volver a iniciar sesión.
                </Typography>
                {unverified && (
                  <Alert severity="info" sx={{ textAlign: "left" }}>
                    Te enviamos un correo para verificar {session.email}. Ábrelo
                    para confirmar que la cuenta es tuya.
                  </Alert>
                )}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ width: { xs: "100%", sm: "auto" } }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    href={`${COMMUNITY_URL}/feed`}
                  >
                    Ir a la comunidad →
                  </Button>
                  <Box component="form" action={signOut}>
                    <Button
                      type="submit"
                      variant="outlined"
                      size="large"
                      fullWidth
                    >
                      Cerrar sesión
                    </Button>
                  </Box>
                </Stack>
              </>
            ) : (
              <>
                <Typography variant="h1">Una cuenta para todo</Typography>
                <Typography variant="subtitle1" sx={{ maxWidth: 560 }}>
                  Inicia sesión una vez con Google, con tu correo y contraseña o
                  con un enlace mágico, y entra directo a la comunidad.
                </Typography>
                <Button variant="contained" size="large" href="/login">
                  Acceder →
                </Button>
              </>
            )}
          </Stack>
        </Container>
      </Box>

      <SiteFooter brand={MAIN_BRAND.name} note={MAIN_BRAND.demoNote} />
    </>
  );
}
