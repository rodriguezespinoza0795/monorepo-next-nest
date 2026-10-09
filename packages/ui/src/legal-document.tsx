import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export interface LegalSection {
  title: string;
  content: ReactNode;
}

interface LegalDocumentProps {
  title: string;
  /** Fecha de la última actualización, ya formateada. */
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
  contactEmail: string;
}

/** Documento legal (privacidad, condiciones): secciones numeradas. */
export const LegalDocument = ({
  title,
  updated,
  intro,
  sections,
  contactEmail,
}: LegalDocumentProps) => (
  <Container
    component="main"
    maxWidth="md"
    sx={{ pt: { xs: 12, sm: 16 }, pb: { xs: 8, sm: 12 } }}
  >
    <Stack spacing={2} sx={{ mb: 5 }}>
      <Chip
        label="Legal"
        variant="outlined"
        size="small"
        sx={{ alignSelf: "flex-start", fontWeight: 600 }}
      />
      <Typography variant="h2" component="h1">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Última actualización: {updated}
      </Typography>
      <Box sx={{ color: "text.secondary", lineHeight: 1.75 }}>{intro}</Box>
    </Stack>

    {sections.map((section, index) => (
      <Box component="section" key={section.title}>
        <Divider sx={{ my: 4 }} />
        <Typography variant="h3" component="h2" gutterBottom>
          {index + 1}. {section.title}
        </Typography>
        <Box
          sx={{
            color: "text.secondary",
            lineHeight: 1.75,
            "& p": { m: 0, mb: 1.5 },
            "& ul": { m: 0, mb: 1.5, pl: 3 },
            "& li": { mb: 0.75 },
            "& strong": { color: "text.primary", fontWeight: 600 },
          }}
        >
          {section.content}
        </Box>
      </Box>
    ))}

    <Divider sx={{ my: 4 }} />
    <Typography variant="body2" color="text.secondary">
      ¿Preguntas sobre este documento? Escríbenos a{" "}
      <Link href={`mailto:${contactEmail}`} underline="hover">
        {contactEmail}
      </Link>
      .
    </Typography>
  </Container>
);
