import { expect, test } from "./support/fixtures";
import { memberApi, postAs } from "./support/members";

// Lo que los miembros NO pueden hacer directo en Stream con su token: todo
// eso solo entra por el servidor (ver docs/reglas-de-negocio.md).
test.describe("permisos directos en Stream", () => {
  test("publicar en un espacio → 403", async ({ newMember }) => {
    const member = await newMember("Fede E2E");
    expect(
      await memberApi(member, "POST", "activities", {
        type: "post",
        feeds: ["space:general"],
        text: "directo",
      }),
    ).toBe(403);
  });

  test("comentar → 403", async ({ newMember }) => {
    const member = await newMember("Gina E2E");
    expect(
      await memberApi(member, "POST", "comments", {
        object_id: "welcome-general",
        object_type: "activity",
        comment: "directo",
      }),
    ).toBe(403);
  });

  test("editar o borrar su propio post → 403", async ({ newMember }) => {
    const member = await newMember("Hugo E2E");
    const post = await postAs(member, "Post de Hugo");
    expect(
      await memberApi(member, "PATCH", `activities/${post.id}`, {
        set: { text: "editado directo" },
      }),
    ).toBe(403);
    expect(await memberApi(member, "DELETE", `activities/${post.id}`)).toBe(
      403,
    );
  });

  test("dar me gusta sí se permite", async ({ newMember }) => {
    const member = await newMember("Iris E2E");
    expect(
      await memberApi(member, "POST", "activities/welcome-general/reactions", {
        type: "like",
      }),
    ).toBe(201);
    await memberApi(
      member,
      "DELETE",
      "activities/welcome-general/reactions/like",
    );
  });
});
