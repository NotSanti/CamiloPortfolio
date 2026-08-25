"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

export type LoginState = {
  error: string | null;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin/projects");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid email or password." };
  }

  const safeNext =
    nextPath.startsWith("/admin") && !nextPath.startsWith("//")
      ? nextPath
      : "/admin/projects";

  redirect(safeNext);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
