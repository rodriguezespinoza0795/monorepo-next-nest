import type { ElementType } from "react";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const joinedFormat = new Intl.DateTimeFormat("es", {
  month: "long",
  year: "numeric",
});

export interface MemberSummary {
  name: string;
  image?: string;
  href?: string;
  joinedAt: Date;
}

/** Tarjeta del directorio: avatar, nombre y desde cuándo es miembro. */
export const MemberCard = ({
  member,
  linkComponent = "a",
}: {
  member: MemberSummary;
  linkComponent?: ElementType;
}) => (
  <Card sx={{ height: "100%" }}>
    <CardActionArea
      component={member.href ? linkComponent : "div"}
      href={member.href}
      sx={{ height: "100%", p: { xs: 2, sm: 2.5 } }}
    >
      <Stack direction="row" spacing={1.75} sx={{ alignItems: "center" }}>
        <Avatar src={member.image} alt="" sx={{ width: 48, height: 48 }}>
          {member.name.charAt(0)}
        </Avatar>
        <Stack sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 600 }}>
            {member.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            Se unió en {joinedFormat.format(member.joinedAt)}
          </Typography>
        </Stack>
      </Stack>
    </CardActionArea>
  </Card>
);

/** Barra lateral: últimos miembros en unirse y enlace al directorio. */
export const NewMembersCard = ({
  members,
  href,
  linkComponent = "a",
}: {
  members: MemberSummary[];
  href: string;
  linkComponent?: ElementType;
}) => (
  <Card sx={{ p: 3 }}>
    <Typography variant="h3" gutterBottom>
      Nuevos miembros
    </Typography>
    {members.length === 0 ? (
      <Typography variant="body2" color="text.secondary">
        Sé de los primeros en unirte.
      </Typography>
    ) : (
      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        <AvatarGroup
          max={6}
          sx={{
            justifyContent: "flex-end",
            "& .MuiAvatar-root": { width: 36, height: 36, fontSize: 15 },
          }}
        >
          {members.map((member) => (
            <Avatar
              key={`${member.name}-${member.joinedAt.toISOString()}`}
              src={member.image}
              alt={member.name}
            >
              {member.name.charAt(0)}
            </Avatar>
          ))}
        </AvatarGroup>
        <Typography variant="body2" color="text.secondary">
          {members
            .slice(0, 3)
            .map((member) => member.name.split(" ")[0])
            .join(", ")}
          {members.length > 3
            ? " y más se unieron hace poco."
            : members.length === 1
              ? " se unió hace poco."
              : " se unieron hace poco."}
        </Typography>
      </Stack>
    )}
    <Button
      component={linkComponent}
      href={href}
      size="small"
      sx={{ mt: 1.5, ml: -1 }}
    >
      Ver todos los miembros →
    </Button>
  </Card>
);
