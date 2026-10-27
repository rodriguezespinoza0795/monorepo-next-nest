import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import { SiteHeader } from "@repo/ui/site-header";
import { MAIN_BRAND } from "../../lib/brand";
import { safeNext } from "../../lib/redirect";
import { getSession } from "../../lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: `Acceder · ${MAIN_BRAND.name}` };

const accentGlow =
  "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99, 102, 241, 0.22), transparent 70%)";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext((await searchParams).next);
  if (await getSession()) redirect(next);

  return (
    <>
      <SiteHeader
        brand={MAIN_BRAND.name}
        action={{ label: "Inicio", href: "/" }}
      />
      <Box
        component="main"
        sx={{
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: 12,
          backgroundImage: accentGlow,
        }}
      >
        <LoginForm next={next} />
      </Box>
    </>
  );
}
