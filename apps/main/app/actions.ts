"use server";

import { redirect } from "next/navigation";
import { deleteSession } from "../lib/session";

// Cierra la sesión en esta app y, como la cookie es compartida, también en
// la comunidad y el panel.
export const signOut = async () => {
  await deleteSession();
  redirect("/");
};
