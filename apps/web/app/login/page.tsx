import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import { SiteHeader } from "@repo/ui/site-header";
import { auth } from "../../lib/auth";
import { LoginForm } from "./login-form";
import { BRAND } from "@repo/community/brand";

export const metadata: Metadata = { title: `Acceder · ${BRAND.name}` };

const accentGlow =
  "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(99, 102, 241, 0.22), transparent 70%)";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/feed");

  return (
    <>
      <SiteHeader brand={BRAND.name} action={{ label: "Inicio", href: "/" }} />
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
        <LoginForm />
      </Box>
    </>
  );
}
