import { expect, test } from "./support/fixtures";

test.describe("acceso", () => {
  test("sin sesión, el feed redirige al login", async ({ page }) => {
    await page.goto("/feed");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("button", { name: "Continuar con Google" }),
    ).toBeVisible();
  });

  test("sin sesión, no se entrega token de Stream", async ({ request }) => {
    const response = await request.get("/api/stream/token");
    expect(response.status()).toBe(401);
  });

  test("con sesión, el login lleva al feed", async ({ page, member }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByText(member.name).first()).toBeVisible();
  });
});
