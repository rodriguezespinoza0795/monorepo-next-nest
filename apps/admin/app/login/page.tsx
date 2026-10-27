import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { SESSION_COOKIE } from "@repo/auth/cookie";
import { appLoginUrl, safeReturnPath } from "@repo/auth/session";
import { EmptyState } from "@repo/ui/feed/empty-state";
import { SiteHeader } from "@repo/ui/site-header";
import { ADMIN_BRAND } from "@repo/community/brand";
import { reportWarning } from "../../lib/report-error";
import { getSession } from "../../lib/session";

export const metadata: Metadata = { title: `Acceder · ${ADMIN_BRAND}` };

// El login vive en la app principal: aquí solo se redirige allá, o a `next`
// si ya hay sesión.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const path = safeReturnPath((await searchParams).next, "/moderacion");
  if (await getSession()) redirect(path);
  if (!(await cookies()).has(SESSION_COOKIE)) redirect(appLoginUrl(path));

  // Hay cookie pero no es válida aquí: redirigir haría un bucle con la app
  // principal si ella sí la acepta (por ejemplo, otro proyecto de Firebase).
  reportWarning("[auth] cookie de sesión presente pero no válida");
  return (
    <>
      <SiteHeader brand={ADMIN_BRAND} action={{ label: "Inicio", href: "/" }} />
      <Box
        component="main"
        sx={{ px: 2, pt: { xs: 12, sm: 16 }, pb: 8, textAlign: "center" }}
      >
        <EmptyState
          title="No pudimos validar tu sesión"
          description="Vuelve a iniciar sesión. Si el problema sigue, avisa al equipo."
        />
        <Button variant="contained" href={appLoginUrl(path)} sx={{ mt: 2 }}>
          Iniciar sesión
        </Button>
      </Box>
    </>
  );
}
