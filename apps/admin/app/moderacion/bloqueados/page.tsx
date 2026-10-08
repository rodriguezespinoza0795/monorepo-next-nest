import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import { stream } from "@repo/community/stream";
import { EmptyState } from "@repo/ui/feed/empty-state";
import { FeedHeader } from "@repo/ui/feed/feed-header";
import { getAdminSession } from "../../../lib/session";
import { UnbanButton } from "../moderation-buttons";

export default async function BannedPage() {
  await getAdminSession();
  const { users } = await stream.queryUsers({
    payload: { filter_conditions: { banned: true }, limit: 100 },
  });

  return (
    <Stack spacing={3}>
      <FeedHeader
        title="Bloqueados"
        description="Miembros que no pueden leer ni participar en la comunidad."
      />
      {users.length === 0 && (
        <EmptyState
          icon={<VerifiedUserOutlinedIcon fontSize="inherit" />}
          title="Nadie está bloqueado"
          description="Cuando bloquees a alguien desde una publicación, aparecerá aquí."
        />
      )}
      {users.map((member) => (
        <Card key={member.id} sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: { sm: "center" } }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "center", flex: 1, minWidth: 0 }}
            >
              <Avatar src={member.image} alt={member.name}>
                {(member.name ?? member.id).charAt(0)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontWeight: 600 }}>
                  {member.name ?? member.id}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {member.id}
                </Typography>
              </Box>
            </Stack>
            <UnbanButton id={member.id} name={member.name ?? member.id} />
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
