import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isListedAdmin } from "@/src/lib/auth/admin-membership";
import { createClient } from "@/src/lib/supabase/server";
import type { Database } from "@/types/database";

export class AdminAuthError extends Error {
  readonly status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
  }
}

export type AdminClient = {
  supabase: SupabaseClient<Database>;
  user: User;
};

export { isListedAdmin } from "@/src/lib/auth/admin-membership";

/**
 * Session + explicit CMS admin membership.
 * Authentication is not authorization: a signed-in user is not an admin
 * unless `public.admin_users` contains their id.
 */
export async function requireAdminClient(): Promise<AdminClient> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AdminAuthError(401, "Authentication required.");
  }

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !isListedAdmin(admin, user.id)) {
    throw new AdminAuthError(403, "Administrator access required.");
  }

  return { supabase, user };
}

export async function isAdminUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return !error && isListedAdmin(data, userId);
}
