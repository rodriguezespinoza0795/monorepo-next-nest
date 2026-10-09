import Box from "@mui/material/Box";

/** Punto de "hay publicaciones nuevas" (con texto para lectores de pantalla). */
export const UnreadDot = ({
  label = "publicaciones nuevas",
}: {
  label?: string;
}) => (
  <Box
    component="span"
    sx={{
      // Ancla el texto oculto al punto (si no, se ubica respecto a un
      // ancestro lejano y queda fuera de la pantalla).
      position: "relative",
      display: "inline-flex",
      width: 8,
      height: 8,
      flexShrink: 0,
      borderRadius: "50%",
      bgcolor: "primary.main",
      boxShadow: "0 0 8px rgba(99,102,241,.8)",
    }}
  >
    <Box
      component="span"
      sx={{
        position: "absolute",
        width: "1px",
        height: "1px",
        m: "-1px",
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </Box>
  </Box>
);
