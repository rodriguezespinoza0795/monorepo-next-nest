import { randomUUID } from "node:crypto";
import type { BrowserContext, Page } from "@playwright/test";
import { E2E_ADMIN_EMAIL } from "../playwright.config";
import { expect, test } from "./support/fixtures";
import { createMember, loginAs, postAs, stream } from "./support/members";

const menuOf = (page: Page, text: string) =>
  page
    .locator("article", { hasText: text })
    .getByRole("button", { name: "Opciones de la publicación" });

const loginAsAdmin = async (context: BrowserContext) => {
  const admin = await createMember("Admin E2E", { email: E2E_ADMIN_EMAIL });
  await context.clearCookies();
  await loginAs(context, admin);
  return admin;
};

test("el admin destaca una publicación por espacio, arriba y sin duplicar", async ({
  page,
  context,
  member,
}) => {
  const tag = randomUUID().slice(0, 6);
  const first = await postAs(member, `Primera destacada ${tag}`);
  const second = await postAs(member, `Segunda destacada ${tag}`);
  // Una más reciente: el destacado debe quedar por encima de ella.
  await postAs(member, `Reciente ${tag}`);
  await loginAsAdmin(context);

  try {
    await page.goto("/feed/general");
    await menuOf(page, `Primera destacada ${tag}`).click();
    await page
      .getByRole("menuitem", { name: "Destacar en el espacio" })
      .click();

    const featured = page.locator("article", { hasText: "Destacado" });
    await expect(
      featured.filter({ hasText: `Primera destacada ${tag}` }),
    ).toBeVisible();
    await expect(featured).toHaveCount(1);
    // Arriba de todo y una sola vez.
    await expect(page.locator("article").first()).toContainText(
      `Primera destacada ${tag}`,
    );
    await expect(
      page.locator("article", { hasText: `Primera destacada ${tag}` }),
    ).toHaveCount(1);

    // Destacar otra reemplaza a la anterior (uno por espacio).
    await menuOf(page, `Segunda destacada ${tag}`).click();
    await page
      .getByRole("menuitem", { name: "Destacar en el espacio" })
      .click();
    // Al cambiar, por un instante pueden verse los dos (el evento de fijar
    // llega antes que el de quitar): se espera el estado final.
    await expect(
      featured.filter({ hasText: `Segunda destacada ${tag}` }),
    ).toBeVisible();
    await expect(featured).toHaveCount(1);

    // En Inicio no se muestran destacados.
    await page.goto("/feed");
    await expect(page.locator("article", { hasText: "Destacado" })).toHaveCount(
      0,
    );

    await page.goto("/feed/general");
    await menuOf(page, `Segunda destacada ${tag}`).click();
    await page.getByRole("menuitem", { name: "Quitar destacado" }).click();
    await expect(featured).toHaveCount(0);
  } finally {
    await Promise.all(
      [first, second].map((post) =>
        stream.feeds
          .unpinActivity({
            feed_group_id: "space",
            feed_id: "general",
            activity_id: post.id,
            user_id: "system",
          })
          .catch(() => {}),
      ),
    );
  }
});

test("un miembro no puede destacar", async ({ page, member, newMember }) => {
  const tag = randomUUID().slice(0, 6);
  const other = await newMember("Olga E2E");
  await postAs(member, `Mía ${tag}`);
  await postAs(other, `Ajena ${tag}`);

  await page.goto("/feed/general");
  // En lo propio solo Editar y Eliminar; en lo ajeno, ni menú.
  await menuOf(page, `Mía ${tag}`).click();
  await expect(page.getByRole("menuitem", { name: "Editar" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /Destacar/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(menuOf(page, `Ajena ${tag}`)).toHaveCount(0);
});

test("guardar una publicación, verla en Guardados y quitarla", async ({
  page,
  member,
  newMember,
}) => {
  const tag = randomUUID().slice(0, 6);
  const other = await newMember("Olga E2E");
  await postAs(other, `Para leer después ${tag}`);
  const gone = await postAs(other, `Se borrará ${tag}`);

  await page.goto("/feed/general");
  for (const text of [`Para leer después ${tag}`, `Se borrará ${tag}`]) {
    const save = page
      .locator("article", { hasText: text })
      .getByRole("button", { name: "Guardar publicación" });
    await save.click();
    await expect(save).toHaveAttribute("aria-pressed", "true");
  }

  // Una publicación eliminada desaparece de Guardados.
  await stream.feeds.deleteActivity({ id: gone.id });

  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Guardados" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/feed\/saved$/);
  const saved = page.getByRole("article");
  await expect(saved).toHaveCount(1);
  await expect(saved).toContainText(`Para leer después ${tag}`);

  await page.getByRole("button", { name: "Quitar de guardados" }).click();
  await expect(page.getByText("Aún no guardas nada")).toBeVisible();

  // De vuelta en el feed ya no está marcada.
  await page.goto("/feed/general");
  await expect(
    page
      .locator("article", { hasText: `Para leer después ${tag}` })
      .getByRole("button", { name: "Guardar publicación" }),
  ).toHaveAttribute("aria-pressed", "false");
  void member;
});

test("guardar desde el detalle de la publicación", async ({ page, member }) => {
  const post = await postAs(member, `Detalle ${randomUUID().slice(0, 6)}`);
  await page.goto(`/feed/post/${post.id}`);
  const save = page.getByRole("button", { name: "Guardar publicación" });
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "false");
});
