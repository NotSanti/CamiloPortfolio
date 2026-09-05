/**
 * Client-safe Supabase env. Import this from browser modules — never import
 * `env.ts` (service role) into Client Components.
 *
 * NEXT_PUBLIC_* values must be read via static `process.env.NEXT_PUBLIC_…`
 * property access so Next.js can inline them into the client bundle.
 */

export function getSupabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Copy .env.example to .env.local and fill in Supabase credentials.",
    );
  }
  return value;
}

/**
 * Client-safe key (legacy anon key or newer publishable key).
 * Prefer NEXT_PUBLIC_SUPABASE_ANON_KEY; fall back to publishable name.
 */
export function getSupabaseAnonKey(): string {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const value = anon ?? publishable;
  if (!value) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY). Copy .env.example to .env.local.",
    );
  }
  return value;
}
