import { randomUUID } from "node:crypto";
import { expect, test } from "./support/fixtures";
import { postAs } from "./support/members";

const uid = () => randomUUID().slice(0, 6);

test("publicar, comentar y responder", async ({ page, member }) => {
  const text = `Post E2E ${uid()}`;
  await page.goto("/feed/general");
  await page.getByLabel("Escribe tu publicación").fill(text);
  await page.getByRole("button", { name: "Publicar" }).click();
  const post = page.locator("article", { hasText: text });
  await expect(post).toBeVisible();
  await expect(post.getByRole("link", { name: member.name })).toBeVisible();

  await post.getByRole("link", { name: /Comentarios/ }).click();
  await expect(page).toHaveURL(/\/feed\/post\//);
  const comments = page.locator("section[aria-label=Comentarios]");
  await page.getByLabel("Escribe un comentario…").fill("Primer comentario");
  await page.getByRole("button", { name: "Comentar", exact: true }).click();
  await expect(
    comments.locator("p", { hasText: "Primer comentario" }),
  ).toBeVisible();

  await comments
    .getByRole("button", { name: "Responder", exact: true })
    .click();
  const reply = page.getByLabel("Escribe una respuesta…");
  await reply.fill("Una respuesta");
  await reply.press("Control+Enter");
  await expect(
    comments.locator("p", { hasText: "Una respuesta" }),
  ).toBeVisible();
});

test("dar y quitar me gusta", async ({ page, member: _, newMember }) => {
  const author = await newMember("Bruno E2E");
  const text = `Post para like ${uid()}`;
  await postAs(author, text);
  await page.goto("/feed/general");
  const like = page
    .locator("article", { hasText: text })
    .getByRole("button", { name: /Me gusta/ });
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await expect(like).toHaveAccessibleName("Me gusta (1)");
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "false");
});

test("editar y eliminar lo propio", async ({ page, member: _ }) => {
  const text = `Post editable ${uid()}`;
  await page.goto("/feed/general");
  await page.getByLabel("Escribe tu publicación").fill(text);
  await page.getByRole("button", { name: "Publicar" }).click();
  const post = page.locator("article", { hasText: text });
  await expect(post).toBeVisible();

  await post
    .getByRole("button", { name: "Opciones de la publicación" })
    .click();
  await page.getByRole("menuitem", { name: "Editar" }).click();
  await page.getByLabel("Editar publicación").fill(`${text} (editado)`);
  await page.getByRole("button", { name: "Guardar" }).click();
  const edited = page.locator("article", { hasText: `${text} (editado)` });
  await expect(edited).toContainText("· editado");

  await edited
    .getByRole("button", { name: "Opciones de la publicación" })
    .click();
  await page.getByRole("menuitem", { name: "Eliminar" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Eliminar publicación" })
    .click();
  await expect(page.locator("article", { hasText: text })).toHaveCount(0);
});

test("lo ajeno no se puede editar", async ({ page, member: _, newMember }) => {
  const author = await newMember("Carla E2E");
  const foreign = await postAs(author, `Post ajeno ${uid()}`);
  const ownText = `Post propio ${uid()}`;

  // Se edita un post propio para capturar la llamada a la server action...
  let action: { id: string; tree: string; body: string } | undefined;
  page.on("request", (request) => {
    const id = request.headers()["next-action"];
    if (id && request.postData()?.includes("editado")) {
      action = {
        id,
        tree: request.headers()["next-router-state-tree"] ?? "",
        body: request.postData() ?? "",
      };
    }
  });
  await page.goto("/feed/general");
  await expect(
    page
      .locator("article", { hasText: foreign.text ?? "" })
      .getByRole("button", { name: "Opciones de la publicación" }),
  ).toHaveCount(0);
  await page.getByLabel("Escribe tu publicación").fill(ownText);
  await page.getByRole("button", { name: "Publicar" }).click();
  const own = page.locator("article", { hasText: ownText });
  await own.getByRole("button", { name: "Opciones de la publicación" }).click();
  await page.getByRole("menuitem", { name: "Editar" }).click();
  await page.getByLabel("Editar publicación").fill(`${ownText} editado`);
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(own).toContainText("· editado");

  // ...y se repite con el post ajeno: el servidor la rechaza.
  expect(action).toBeDefined();
  const [args] = JSON.parse(action!.body) as [Record<string, unknown>];
  const response = await page.request.post("/feed/general", {
    headers: {
      "next-action": action!.id,
      "next-router-state-tree": action!.tree,
      accept: "text/x-component",
      "content-type": "text/plain;charset=UTF-8",
    },
    data: JSON.stringify([
      { ...args, activityId: foreign.id, text: "hackeado" },
    ]),
  });
  expect(await response.text()).toContain(
    "Solo puedes editar tus publicaciones.",
  );
});
