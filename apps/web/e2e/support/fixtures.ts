import { test as base } from "@playwright/test";
import {
  createMember,
  deleteMemberContent,
  loginAs,
  type Member,
} from "./members";

// `member`: miembro con sesión iniciada en el navegador de la prueba.
// `newMember()`: crea más miembros (sin sesión). Su contenido se borra al
// terminar cada prueba; los usuarios, al terminar la corrida.
export const test = base.extend<{
  member: Member;
  newMember: (name: string) => Promise<Member>;
}>({
  // eslint-disable-next-line no-empty-pattern
  newMember: async ({}, use) => {
    const created: Member[] = [];
    await use(async (name) => {
      const member = await createMember(name);
      created.push(member);
      return member;
    });
    await deleteMemberContent(created);
  },
  member: async ({ context, newMember }, use) => {
    const member = await newMember("Ana E2E");
    await loginAs(context, member);
    await use(member);
  },
});

export { expect } from "@playwright/test";
