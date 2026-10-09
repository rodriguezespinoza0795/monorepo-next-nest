import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface SiteFooterProps {
  brand: string;
  /** Texto corto junto al copyright, por ejemplo un aviso de demo. */
  note?: string;
  /** Enlaces del pie, por ejemplo las páginas legales. */
  links?: { label: string; href: string }[];
}

export const SiteFooter = ({ brand, note, links = [] }: SiteFooterProps) => (
  <Box component="footer" sx={{ borderTop: 1, borderColor: "divider", py: 4 }}>
    <Container maxWidth="lg">
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1.5, sm: 3 }}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} {brand}
          {note && ` · ${note}`}
        </Typography>
        {links.length > 0 && (
          <Stack component="nav" aria-label="Legal" direction="row" spacing={3}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                variant="body2"
                underline="hover"
                color="text.secondary"
              >
                {link.label}
              </Link>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  </Box>
);
