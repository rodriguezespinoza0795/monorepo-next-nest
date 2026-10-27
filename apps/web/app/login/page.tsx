import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { SESSION_COOKIE } from "@repo/auth/cookie";
import { EmptyState } from "@repo/ui/feed/empty-state";
import { SiteHeader } from "@repo/ui/site-header";
import { BRAND } from "@repo/community/brand";
import { reportWarning } from "../../lib/report-error";
import {
  communityLoginUrl,
  getSession,
  safeReturnPath,
} from "../../lib/session";

export const metadata: Metadata = { title: `Acceder · ${BRAND.name}` };

// El login vive en la app principal: aquí solo se redirige allá, o a `next`
// si ya hay sesión.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const path = safeReturnPath((await searchParams).next);
  if (await getSession()) redirect(path);

  const loginUrl = communityLoginUrl(path);
  if (!(await cookies()).has(SESSION_COOKIE)) redirect(loginUrl);

  // Hay cookie pero no es válida aquí. Si la app principal sí la acepta (por
  // ejemplo, otro proyecto de Firebase por error de configuración), redirigir
  // haría un bucle infinito entre las dos apps: se muestra un aviso.
  reportWarning("[auth] cookie de sesión presente pero no válida");
  return (
    <>
      <SiteHeader brand={BRAND.name} action={{ label: "Inicio", href: "/" }} />
      <Box
        component="main"
        sx={{ px: 2, pt: { xs: 12, sm: 16 }, pb: 8, textAlign: "center" }}
      >
        <EmptyState
          title="No pudimos validar tu sesión"
          description="Vuelve a iniciar sesión. Si el problema sigue, avísanos."
        />
        <Button variant="contained" href={loginUrl} sx={{ mt: 2 }}>
          Iniciar sesión
        </Button>
      </Box>
    </>
  );
}
