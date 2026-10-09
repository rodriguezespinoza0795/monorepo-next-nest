import { randomUUID } from "node:crypto";
import { devices } from "@playwright/test";
import { expect, test } from "./support/fixtures";
import { postAs, stream } from "./support/members";

// Mejoras pedidas por usuarios: cerrar sesión en móvil, "me gusta" en
// comentarios y enlaces en publicaciones y comentarios.

// Pantalla y táctil de iPhone 13, en el mismo Chromium del resto de pruebas.
const { defaultBrowserType: _browser, ...iPhone13 } = devices["iPhone 13"];

test.describe("menú de la cuenta en móvil", () => {
  test.use(iPhone13);

  test("cerrar sesión desde el avatar del encabezado", async ({
    page,
    member,
  }) => {
    await page.goto("/feed");
    await page
      .getByRole("button", { name: `Cuenta de ${member.name}` })
      .click();
    const menu = page.getByRole("menu");
    await expect(
      menu.getByRole("menuitem", { name: "Mi perfil" }),
    ).toBeVisible();
    await menu.getByRole("menuitem", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test("dar me gusta a un comentario avisa a su autor", async ({
  page,
  member,
  newMember,
}) => {
  const post = await postAs(member, `Post con comentario ${randomUUID()}`);
  const commenter = await newMember("Olga E2E");
  await stream.feeds.addComment({
    object_id: post.id,
    object_type: "activity",
    comment: "Comentario de Olga",
    user_id: commenter.id,
  });

  await page.goto(`/feed/post/${post.id}`);
  const like = page.getByRole("button", { name: /Me gusta el comentario/ });
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await expect(like).toHaveAccessibleName("Me gusta el comentario (1)");

  await expect(async () => {
    const { aggregated_activities } = await stream.feeds.getOrCreateFeed({
      feed_group_id: "notification",
      feed_id: commenter.id,
      user_id: commenter.id,
    });
    expect(
      aggregated_activities.map((group) => group.activities[0]?.type),
    ).toContain("comment_reaction");
  }).toPass();

  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "false");
});

test("enlaces con texto, URLs sueltas y nada de javascript:", async ({
  page,
  member,
}) => {
  const tag = randomUUID().slice(0, 6);
  const created = await postAs(
    member,
    `Post ${tag}: [mi sitio](https://example.com/docs) y https://example.com. ` +
      "[malo](javascript:alert(1))",
  );
  // Stream genera la vista previa del enlace y marca su propio `edited_at`.
  await expect(async () => {
    const { activity } = await stream.feeds.getActivity({ id: created.id });
    expect(activity.edited_at).toBeTruthy();
  }).toPass({ timeout: 20_000 });
  await page.goto("/feed/general");
  const post = page.locator("article", { hasText: `Post ${tag}` });

  const labelled = post.getByRole("link", { name: "mi sitio" });
  await expect(labelled).toHaveAttribute("href", "https://example.com/docs");
  await expect(labelled).toHaveAttribute("target", "_blank");
  await expect(labelled).toHaveAttribute("rel", /noopener/);
  await expect(post).not.toContainText("https://example.com/docs");

  // La URL suelta se enlaza sin el punto final.
  await expect(
    post.getByRole("link", { name: "https://example.com" }),
  ).toHaveAttribute("href", "https://example.com");

  // `javascript:` nunca se convierte en enlace.
  await expect(post.getByRole("link", { name: "malo" })).toHaveCount(0);

  // …pero nadie lo editó: no lleva "· editado".
  await expect(post).not.toContainText("· editado");

  // La vista previa de Stream se muestra como tarjeta del enlace, nunca como
  // foto del post (example.com no tiene imagen: la tarjeta lleva un icono).
  await page.reload();
  const card = post.getByRole("link", { name: /Example Domain/ });
  await expect(card).toHaveAttribute("href", "https://example.com");
  await expect(card).toHaveAttribute("target", "_blank");
  await expect(post.locator("img:not(a img)")).toHaveCount(0);
});

test("insertar un enlace con texto desde el composer", async ({
  page,
  member: _,
}) => {
  const tag = randomUUID().slice(0, 6);
  await page.goto("/feed/general");
  await page.getByLabel("Escribe tu publicación").fill(`Mira ${tag}`);
  await page.getByRole("button", { name: "Insertar enlace" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Insertar enlace" });
  await dialog.getByLabel("Texto (opcional)").fill("la guía");
  await dialog.getByLabel("Dirección (URL)").fill("example.com/guia");
  await dialog.getByRole("button", { name: "Insertar", exact: true }).click();
  await expect(page.getByLabel("Escribe tu publicación")).toHaveValue(
    `Mira ${tag} [la guía](https://example.com/guia) `,
  );
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(
    page
      .locator("article", { hasText: `Mira ${tag}` })
      .getByRole("link", { name: "la guía" }),
  ).toHaveAttribute("href", "https://example.com/guia");
});
