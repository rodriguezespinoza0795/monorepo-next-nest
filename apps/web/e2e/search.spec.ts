import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { expect, test } from "./support/fixtures";
import { postAs, stream } from "./support/members";

// Etiqueta única (solo letras): Stream busca por palabras y prefijos.
const uniqueTag = () =>
  `zq${randomUUID()
    .replace(/[^a-f]/g, "")
    .slice(0, 8)}`;

// Stream tarda unos segundos en indexar lo recién publicado.
const searchUntil = async (
  page: Page,
  url: string,
  check: () => Promise<void>,
) =>
  expect(async () => {
    await page.goto(url);
    await check();
  }).toPass({ timeout: 30_000 });

test("buscar publicaciones por prefijo y sin acentos, y abrir una", async ({
  page,
  member,
}) => {
  const tag = uniqueTag();
  const post = await postAs(member, `Taller de fotografía nocturna ${tag}`);
  await postAs(member, `Receta de tamales ${tag}`);

  // "fotografia" sin acento y la etiqueta: solo el taller.
  const results = page.getByRole("article");
  await searchUntil(page, `/feed/search?q=fotografia+${tag}`, async () => {
    await expect(results).toHaveCount(1, { timeout: 2000 });
  });
  await expect(
    page.getByRole("tab", { name: "Publicaciones (1)" }),
  ).toHaveAttribute("aria-selected", "true");
  // Resalta la palabra encontrada tal como está escrita (con acento).
  await expect(results.locator("mark").first()).toHaveText("fotografía");

  // Varias palabras: cada una como prefijo y en cualquier orden.
  await page.goto(`/feed/search?q=noct+fotog+${tag.slice(0, 5)}`);
  await expect(results).toHaveCount(1);
  await expect(results).toContainText("Taller de fotografía nocturna");

  await results.first().getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`/feed/post/${post.id}$`));
});

test("escribir en el buscador actualiza los resultados", async ({
  page,
  member,
}) => {
  const tag = uniqueTag();
  await postAs(member, `Charla sobre bicicletas ${tag}`);
  await searchUntil(page, `/feed/search?q=${tag}`, async () => {
    await expect(page.getByRole("article")).toHaveCount(1, { timeout: 2000 });
  });

  await page.goto("/feed");
  await page.getByRole("link", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/\/feed\/search$/);
  await expect(page.getByText("¿Qué estás buscando?")).toBeVisible();

  // Prefijo de la etiqueta: se busca solo, sin pulsar Enter.
  await page.getByLabel("Buscar en la comunidad").fill(tag.slice(0, 6));
  await expect(page).toHaveURL(new RegExp(`q=${tag.slice(0, 6)}`));
  await expect(
    page.getByRole("article").filter({ hasText: "Charla sobre bicicletas" }),
  ).toBeVisible();
});

test("buscar miembros y abrir su perfil", async ({
  page,
  member: _,
  newMember,
}) => {
  const tag = uniqueTag();
  const found = await newMember(`Zoila ${tag}`);

  await searchUntil(page, `/feed/search?q=${tag}&tab=members`, async () => {
    await expect(page.getByRole("tab", { name: "Miembros (1)" })).toBeVisible({
      timeout: 2000,
    });
  });
  await page.getByRole("link", { name: `Zoila ${tag}` }).click();
  await expect(page).toHaveURL(
    new RegExp(`/feed/u/${encodeURIComponent(found.id)}$`),
  );
});

test("no aparecen publicaciones eliminadas ni de miembros bloqueados", async ({
  page,
  member,
  newMember,
}) => {
  const tag = uniqueTag();
  const visible = await postAs(member, `Visible ${tag}`);
  const removed = await postAs(member, `Eliminada ${tag}`);
  const banned = await newMember(`Bloqueado ${tag}`);
  await postAs(banned, `De bloqueado ${tag}`);

  await stream.feeds.deleteActivity({ id: removed.id });
  await stream.moderation.ban({
    target_user_id: banned.id,
    banned_by_id: member.id,
  });

  await searchUntil(page, `/feed/search?q=${tag}`, async () => {
    await expect(page.getByRole("article")).toHaveCount(1, { timeout: 2000 });
  });
  await expect(page.getByRole("article")).toContainText(`Visible ${tag}`);
  await expect(page.getByRole("article").getByRole("link")).toHaveAttribute(
    "href",
    `/feed/post/${visible.id}`,
  );
  // El bloqueado tampoco aparece entre los miembros.
  await page.getByRole("tab", { name: /Miembros/ }).click();
  await expect(page.getByText("Sin miembros")).toBeVisible();
});
