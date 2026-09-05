import {
  getSupabaseAnonKey,
  getSupabaseUrl,
} from "@/src/lib/supabase/env-public";

export { getSupabaseAnonKey, getSupabaseUrl };

/** Server-only. Never import this module from Client Components. */
export function getSupabaseServiceRoleKey(): string {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local and fill in Supabase credentials.",
    );
  }
  return value;
}
