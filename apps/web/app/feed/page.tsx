import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { SiteHeader } from "@repo/ui/site-header";
import { auth } from "../../lib/auth";
import { ConnectionStatus } from "./connection-status";
import { FeedsProvider } from "./feeds-provider";

export const metadata: Metadata = { title: "Comunidad · getStream" };

export default async function FeedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { streamId, name, image } = session.user;

  return (
    <>
      <SiteHeader brand="getStream" action={{ label: "Inicio", href: "/" }} />
      <Box component="main" sx={{ pt: { xs: 10, sm: 12 }, pb: 8 }}>
        <Container maxWidth="sm">
          <FeedsProvider user={{ id: streamId, name, image }}>
            <ConnectionStatus />
          </FeedsProvider>
        </Container>
      </Box>
    </>
  );
}
