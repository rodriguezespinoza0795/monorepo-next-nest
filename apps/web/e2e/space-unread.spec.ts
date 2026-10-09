import { expect, test } from "./support/fixtures";
import { postAs, stream } from "./support/members";

// Punto de "publicaciones nuevas" junto a cada espacio. Se prueba en
// Anuncios, donde no publica ninguna otra prueba (en General publican todas
// en paralelo), y en serie para que estas no se mezclen entre sí.
test.describe.configure({ mode: "serial" });

const anuncios = (page: import("@playwright/test").Page) =>
  page
    .getByRole("navigation")
    .first()
    .getByRole("link", { name: /^Anuncios/ });

test("un post nuevo de otra persona enciende el punto; entrar lo apaga", async ({
  page,
  member: _,
  newMember,
}) => {
  const other = await newMember("Olga E2E");
  await postAs(other, "Aviso nuevo para todos", "anuncios");

  await page.goto("/feed");
  await expect(anuncios(page)).toHaveAccessibleName(
    "Anuncios publicaciones nuevas",
  );

  // En móvil, el botón "Espacios" también lo indica.
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: /^Espacios/ }),
  ).toHaveAccessibleName("Espacios publicaciones nuevas");
  await page.setViewportSize({ width: 1280, height: 800 });

  await anuncios(page).click();
  await expect(page).toHaveURL(/\/feed\/anuncios$/);
  await expect(anuncios(page)).toHaveAccessibleName("Anuncios");

  // Sigue apagado al volver (la visita queda guardada).
  await page.goto("/feed");
  await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
  await expect(anuncios(page)).toHaveAccessibleName("Anuncios");
});

test("los posts propios no encienden el punto", async ({ page, member }) => {
  await postAs(member, "Mi propio aviso", "anuncios");
  await page.goto("/feed");
  await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
  // Da tiempo a que llegue la respuesta del servidor.
  await page.waitForLoadState("networkidle");
  await expect(anuncios(page)).toHaveAccessibleName("Anuncios");
});

test("sin punto en los espacios de los que no eres miembro", async ({
  page,
  member,
  newMember,
}) => {
  await stream.feeds.unfollow({
    source: `timeline:${member.id}`,
    target: "space:anuncios",
  });
  const other = await newMember("Olga E2E");
  await postAs(other, "Aviso que no sigue", "anuncios");

  await page.goto("/feed");
  await page.waitForLoadState("networkidle");
  await expect(anuncios(page)).toHaveAccessibleName("Anuncios");
});
