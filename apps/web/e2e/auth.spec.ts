import { SESSION_COOKIE } from "@repo/auth/cookie";
import { E2E_BASE_URL, E2E_LOGIN_URL } from "../playwright.config";
import { expect, test } from "./support/fixtures";

test.describe("acceso", () => {
  test("sin sesión, el feed manda al login de la app principal y vuelve a la misma página", async ({
    request,
  }) => {
    const feed = await request.get("/feed/general", { maxRedirects: 0 });
    expect(feed.status()).toBe(307);
    expect(feed.headers().location).toBe("/login?next=%2Ffeed%2Fgeneral");

    const login = await request.get("/login?next=/feed/general", {
      maxRedirects: 0,
    });
    expect(login.status()).toBe(307);
    const target = new URL(login.headers().location ?? "");
    expect(`${target.origin}${target.pathname}`).toBe(E2E_LOGIN_URL);
    expect(target.searchParams.get("next")).toBe(
      `${E2E_BASE_URL}/feed/general`,
    );
  });

  test("el login no devuelve a sitios ajenos", async ({ request }) => {
    const login = await request.get("/login?next=//evil.example", {
      maxRedirects: 0,
    });
    const target = new URL(login.headers().location ?? "");
    expect(target.searchParams.get("next")).toBe(`${E2E_BASE_URL}/feed`);
  });

  test("sin sesión, no se entrega token de Stream", async ({ request }) => {
    const response = await request.get("/api/stream/token");
    expect(response.status()).toBe(401);
  });

  test("una cookie no válida muestra un aviso en vez de redirigir en bucle", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: SESSION_COOKIE,
        value: "no-es-una-sesion",
        domain: "localhost",
        path: "/",
      },
    ]);
    // Pasa `proxy.ts` (hay cookie), el layout no la acepta y manda a /login.
    await page.goto("/feed");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "No pudimos validar tu sesión" }),
    ).toBeVisible();
  });

  test("con sesión, el login lleva al feed", async ({ page, member }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/feed$/);
    await expect(page.getByText(member.name).first()).toBeVisible();
  });
});
