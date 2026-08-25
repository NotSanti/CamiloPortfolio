import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from "@/src/lib/supabase/env";

/**
 * Service-role client. Bypasses RLS — server-only (Route Handlers, scripts).
 * Never import this module from Client Components or expose the key publicly.
 */
export function createServiceClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createServiceClient() must only be called on the server.",
    );
  }

  return createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
