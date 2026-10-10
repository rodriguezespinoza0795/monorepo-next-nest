import { randomUUID } from "node:crypto";
import { expect, test } from "./support/fixtures";
import { stream } from "./support/members";

// Etiqueta única (solo letras): la búsqueda de nombres es por prefijos.
const uniqueTag = () =>
  `zq${randomUUID()
    .replace(/[^a-f]/g, "")
    .slice(0, 8)}`;

test("el directorio lista a los miembros recientes y abre su perfil", async ({
  page,
  member,
}) => {
  await page.goto("/feed");
  // Barra lateral: tarjeta de nuevos miembros con enlace al directorio.
  await expect(
    page.getByRole("heading", { name: "Nuevos miembros" }),
  ).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Miembros" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/feed\/members$/);
  await expect(
    page.getByRole("heading", { name: "Miembros", exact: true }),
  ).toBeVisible();

  // Recién creado: aparece en la primera página ("Más recientes").
  const card = page.getByRole("link", { name: new RegExp(member.name) });
  await expect(card.first()).toBeVisible();
  await expect(card.first()).toContainText("Se unió en");
});

test("filtrar por nombre, ordenar A–Z y entrar al perfil", async ({
  page,
  member: _,
  newMember,
}) => {
  const tag = uniqueTag();
  const zoila = await newMember(`Zoila ${tag}`);
  await newMember(`Abel ${tag}`);

  // Filtro por nombre (prefijo de la etiqueta): los dos, en orden A–Z.
  await expect(async () => {
    await page.goto(`/feed/members?q=${tag.slice(0, 6)}`);
    await expect(page.getByRole("link", { name: /Se unió en/ })).toHaveCount(
      2,
      { timeout: 2000 },
    );
  }).toPass({ timeout: 30_000 });
  const cards = page.getByRole("link", { name: /Se unió en/ });
  await expect(cards.nth(0)).toContainText(`Abel ${tag}`);
  await expect(cards.nth(1)).toContainText(`Zoila ${tag}`);

  // Escribir en el campo actualiza la lista.
  await page.getByLabel("Buscar miembros").fill(`zoi ${tag}`);
  await expect(page).toHaveURL(/q=zoi/);
  await expect(cards).toHaveCount(1);
  await cards.first().click();
  await expect(page).toHaveURL(
    new RegExp(`/feed/u/${encodeURIComponent(zoila.id)}$`),
  );
});

test("orden A–Z y sin miembros bloqueados", async ({
  page,
  member,
  newMember,
}) => {
  const tag = uniqueTag();
  const banned = await newMember(`Bloqueada ${tag}`);
  await stream.moderation.ban({
    target_user_id: banned.id,
    banned_by_id: member.id,
  });

  await page.goto("/feed/members");
  await page.getByRole("link", { name: "A–Z" }).click();
  await expect(page).toHaveURL(/sort=name/);
  await expect(page.getByRole("link", { name: "A–Z" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.goto(`/feed/members?q=${tag}`);
  await expect(page.getByText("Sin miembros")).toBeVisible();
});
