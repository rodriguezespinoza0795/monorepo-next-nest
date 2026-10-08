import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface ProfileHeaderProps {
  name: string;
  image?: string;
  memberSince?: Date;
  /** Muestra la etiqueta "Tú" cuando es el perfil propio. */
  isMe?: boolean;
}

const monthYear = new Intl.DateTimeFormat("es", {
  month: "long",
  year: "numeric",
});

export const ProfileHeader = ({
  name,
  image,
  memberSince,
  isMe = false,
}: ProfileHeaderProps) => (
  <Card
    sx={{
      p: { xs: 3, sm: 4 },
      backgroundImage:
        "radial-gradient(ellipse 70% 90% at 0% 0%, rgba(99, 102, 241, 0.18), transparent 70%)",
    }}
  >
    <Stack
      direction="row"
      spacing={{ xs: 2, sm: 3 }}
      sx={{ alignItems: "center" }}
    >
      <Avatar
        src={image}
        alt={name}
        sx={{
          width: { xs: 64, sm: 80 },
          height: { xs: 64, sm: 80 },
          fontSize: 32,
          boxShadow: "0 0 32px rgba(99, 102, 241, 0.35)",
        }}
      >
        {name.charAt(0)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", minWidth: 0 }}
        >
          <Typography
            variant="h2"
            component="h1"
            noWrap
            sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
          >
            {name}
          </Typography>
          {isMe && <Chip label="Tú" size="small" variant="outlined" />}
        </Stack>
        {memberSince && (
          <Typography color="text.secondary">
            Miembro desde {monthYear.format(memberSince)}
          </Typography>
        )}
      </Box>
    </Stack>
  </Card>
);
