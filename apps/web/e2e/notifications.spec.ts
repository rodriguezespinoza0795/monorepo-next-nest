import { randomUUID } from "node:crypto";
import { expect, test } from "./support/fixtures";
import { postAs, stream } from "./support/members";

test("la campana avisa en tiempo real de un comentario", async ({
  page,
  member,
  newMember,
}) => {
  const post = await postAs(member, "Post para notificaciones");
  const other = await newMember("Diego E2E");
  await page.goto("/feed");
  const bell = page.getByRole("button", { name: /^Notificaciones/ });
  await expect(bell).toHaveAccessibleName("Notificaciones");

  await stream.feeds.addComment({
    object_id: post.id,
    object_type: "activity",
    comment: "¡Buen post!",
    user_id: other.id,
    create_notification_activity: true,
  });
  await expect(bell).toHaveAccessibleName("Notificaciones (1 nuevas)");

  await bell.click();
  const panel = page.getByRole("dialog", { name: "Notificaciones" });
  await expect(panel).toContainText("Diego E2E comentó tu publicación");
  await panel.getByRole("link", { name: /comentó tu publicación/ }).click();
  await expect(page).toHaveURL(new RegExp(`/feed/post/${post.id}$`));
});

test("mencionar con @ notifica a la persona", async ({
  page,
  member: _,
  newMember,
}) => {
  // Nombre único: el autocompletado busca entre todos los miembros.
  const name = `Elena ${randomUUID().slice(0, 4)}`;
  const mentioned = await newMember(name);
  await page.goto("/feed/general");
  const composer = page.getByLabel("Escribe tu publicación");
  await composer.click();
  // El autocompletado busca lo escrito tras `@` hasta el primer espacio.
  await composer.pressSequentially("Hola @Elena", { delay: 30 });
  await page.getByRole("menuitem", { name }).click();
  await expect(composer).toHaveValue(`Hola @${name} `);
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(
    page.getByRole("link", { name: `@${name}` }).first(),
  ).toBeVisible();

  await expect(async () => {
    const { aggregated_activities } = await stream.feeds.getOrCreateFeed({
      feed_group_id: "notification",
      feed_id: mentioned.id,
      user_id: mentioned.id,
    });
    expect(
      aggregated_activities.map((group) => group.activities[0]?.type),
    ).toContain("mention");
  }).toPass();
});
