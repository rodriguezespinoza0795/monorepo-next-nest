import type { Metadata } from "next";
import Box from "@mui/material/Box";
import { SiteHeader } from "@repo/ui/site-header";
import { MAIN_BRAND } from "../../../lib/brand";
import { safeNext } from "../../../lib/redirect";
import { EmailLinkFinish } from "./email-link-finish";

export const metadata: Metadata = { title: `Entrando · ${MAIN_BRAND.name}` };

// Destino del enlace mágico: termina el inicio de sesión en el navegador.
export default async function EmailLinkPage({
  searchParams,
}: PageProps<"/login/enlace">) {
  const next = safeNext((await searchParams).next);

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
        }}
      >
        <EmailLinkFinish next={next} />
      </Box>
    </>
  );
}
