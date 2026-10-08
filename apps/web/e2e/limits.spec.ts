import { randomUUID } from "node:crypto";
import { expect, test } from "./support/fixtures";

test("un comentario de más de 2000 caracteres se rechaza en el servidor", async ({
  page,
  member: _,
}) => {
  await page.goto("/feed/post/welcome-general");
  const box = page.getByLabel("Escribe un comentario…");
  // Se quita el límite del navegador para que llegue al servidor.
  await box.evaluate((element) => element.removeAttribute("maxlength"));
  await box.fill("x".repeat(2100));
  await page.getByRole("button", { name: "Comentar", exact: true }).click();
  await expect(
    page.locator("section[aria-label=Comentarios]").getByRole("alert"),
  ).toHaveText("Máximo 2000 caracteres.");
});

test("el comentario 21 en 10 minutos se bloquea", async ({
  page,
  member: _,
}) => {
  test.skip(
    !process.env.UPSTASH_REDIS_REST_URL,
    "Sin Upstash no hay límite de frecuencia que probar",
  );
  test.slow();
  await page.goto("/feed/post/welcome-general");
  const box = page.getByLabel("Escribe un comentario…");
  const send = page.getByRole("button", { name: "Comentar", exact: true });
  for (let i = 1; i <= 20; i++) {
    await box.fill(`Comentario ${i} · ${randomUUID().slice(0, 4)}`);
    await send.click();
    await expect(box).toHaveValue("");
  }
  await box.fill("Uno de más");
  await send.click();
  await expect(
    page.locator("section[aria-label=Comentarios]").getByRole("alert"),
  ).toHaveText("Comentaste varias veces seguidas. Espera unos minutos.");
});
