import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/src/lib/supabase/env";

/**
 * Cookie-free anon client for public server reads (SSG, RSC, generateStaticParams).
 * Respects RLS; never use for privileged writes.
 */
export function createPublicClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
