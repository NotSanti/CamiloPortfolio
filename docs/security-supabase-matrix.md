# Security Supabase matrix

Enumerated from repository migrations, TypeScript clients, and a read-only inspection of hosted project `CaloidDB` (`lqsznrkrtxdfhtzydluy`, `us-west-2`) on 2026-09-05. No private row contents, emails, or secrets are recorded here.

Hosted schema currently matches repository migrations **after** `admin_authorization` and `storage_admin_write_policies` (applied 2026-09-05). `admin_users` exists. CMS write policies use `is_admin()`. Storage writes require `is_admin()`.

## Client instances

| File | Client type | Key source | Executes in browser? | Carries user session? | Bypasses RLS? | Appropriate? |
|---|---|---|---:|---:|---:|---:|
| `src/lib/supabase/client.ts` | BROWSER_ANON / PUBLISHABLE | `getSupabaseUrl()` + `getSupabaseAnonKey()` via `createBrowserClient` | Yes | Yes (browser cookies/storage) | No | Yes — Client Components / uploads |
| `src/lib/supabase/server.ts` | SERVER_USER_SESSION | Anon/publishable + `cookies()` via `createServerClient` | No | Yes | No | Yes — RSC, Server Actions, route handlers |
| `src/lib/supabase/proxy.ts` | SERVER_USER_SESSION | Anon/publishable + request cookies | No (proxy) | Yes (refresh) | No | Yes — `/admin` gate + cookie refresh |
| `src/lib/supabase/public.ts` | BROWSER_ANON equivalent on server | Anon/publishable, `persistSession: false` | No | No | No | Yes — public SSG/RSC reads |
| `src/lib/supabase/admin.ts` | SERVER_ADMIN / SERVICE ROLE | `SUPABASE_SERVICE_ROLE_KEY` | Guard: throws if `window` defined | No | **Yes** | Yes **if** server-only. Imported by `handle-mux-webhook.ts` only. |
| `src/lib/supabase/env.ts` | helpers | `NEXT_PUBLIC_SUPABASE_*` and `SUPABASE_SERVICE_ROLE_KEY` | **Partial** — this module is imported by `client.ts`, so the service-role **getter** lives in a shared module. Next.js does not inline non-`NEXT_PUBLIC_` values. Existing `.next/static` scan: service-role / Mux secret **names** not found in client assets. | — | — | Split server-only env helpers to reduce accidental bundling. |
| `scripts/migrate-images-to-storage.mjs` | SCRIPT_ONLY | Prefers service role, falls back to anon | No | No | If service key present | Yes — CLI migration |
| `scripts/migrate-videos-to-mux.mjs` | SCRIPT_ONLY | Service role + Mux tokens | No | No | Yes | Yes — CLI migration |

### Hard rule

Service-role client is not imported from Client Components. `createServiceClient()` throws in the browser. Mux server client has the same window guard.

## Tables (public schema)

| Table | RLS enabled (repo + hosted) | Anon SELECT | Anon INSERT/UPDATE/DELETE | Authenticated non-admin | Admin (today) | Draft isolation | Broad USING/CHECK true? | Grants vs policies | SECURITY DEFINER | Integration tests |
|---|---:|---|---|---|---|---|---|---|---:|---|
| `projects` | Yes | Published only | Denied by RLS | **Full read/write** (`USING (true)` / `WITH CHECK (true)`) | Same as any authenticated user | Drafts readable by any auth user | **Yes** (writes + authenticated select-all) | Hosted: `anon` and `authenticated` have INSERT/UPDATE/DELETE/TRUNCATE/TRIGGER/REFERENCES as well as SELECT. RLS is the only write brake for anon. | `set_updated_at` trigger is **not** security definer | None |
| `project_images` | Yes | Rows whose parent project is published | Denied by RLS | **Full read/write** | Same | Draft image metadata readable by any auth user | **Yes** | Same broad default grants | No | None |
| `project_videos` | Yes | Rows whose parent project is published (all columns, including `mux_asset_id`, `mux_upload_id`) | Denied by RLS | **Full read/write** | Same | Draft video metadata readable by any auth user | **Yes** | Same | No | None |
| `site_settings` | Yes | **All rows/columns** (`USING (true)`) | UPDATE denied by RLS; INSERT/DELETE have no policy | **UPDATE all** (`USING (true)` `WITH CHECK (true)`). No insert/delete policies. | Same | N/A (singleton; all public) | **Yes** (select public; update authenticated) | Migration granted `SELECT` to anon/authenticated and `UPDATE` to authenticated; hosted still shows default ALL privileges for anon/authenticated | No | None |

No views. Functions: `public.set_updated_at` (trigger, `search_path = ''`, invoker).

### Table-by-table questions (current answers)

- RLS enabled where appropriate? **Yes** on all four public tables.
- Anon writes? **Blocked by RLS** (not by grants).
- Authenticated non-admin writes? **Allowed** — this is SEC-001.
- Access different for drafts? **Yes for anon** (published only). **No for authenticated.**
- Relational leakage for anon? Image/video policies check parent `is_published`. Anon cannot select draft child rows via PostgREST.
- Conflicting policies? Overlapping SELECT for authenticated (published policy OR using-true). Permissive OR is intended for admins, overly broad for all auth users.
- Broad USING/CHECK true? **Yes** on all CMS write policies.
- Grants broader than policies? **Yes** — anon still has table-level INSERT/UPDATE/DELETE.
- SECURITY DEFINER involved? **No** for application functions.
- Integration tests proving the matrix? **No.**

## Storage

| Bucket | Public? | Intentional? | Anon list/read | Anon upload/update/delete | Authenticated non-admin upload/overwrite/delete | Admin | Draft leak | Size/type | Paths | Signed URLs | Tests |
|---|---:|---|---|---|---|---|---|---|---|---|---|
| `portfolio-media` | **Yes** (50 MiB, jpeg/png/webp) | Yes for published portfolio + `next/image` | SELECT policy `TO public` on `storage.objects` where `bucket_id = 'portfolio-media'`. Public bucket objects are also reachable by public URL. | No write policies for anon | **Yes** — insert/update/delete for any `authenticated` user on this bucket | Same | Unpublished files live in the same public bucket (`projects/{id}/gallery/…`, `site/portrait/…`). UUID in filename reduces guessing; listing/public URL still expose objects. | Bucket MIME + size; client `validateImageFile` is not a substitute | Predictable prefix + UUID | Not used | None |

Hosted: 1 bucket, RLS on `storage.objects`, ~242 objects at inspection time.

## Hosted instance snapshot (Phase 6 preview)

Recorded without copying private data.

| Check | Result |
|---|---|
| Public tables | `projects`, `project_images`, `project_videos`, `site_settings` — all RLS on |
| Policy drift vs repo | **None observed** — same policy names and `true` write expressions |
| Extra public tables | None |
| `admin_users` | **Missing** |
| Public functions | `set_updated_at` only, not security definer |
| Auth users | **2** confirmed users, both have signed in (identities not listed here) |
| Storage | `portfolio-media` public, 50 MiB, jpeg/png/webp |
| Security advisor | Leaked-password protection **disabled** (WARN) |
| Signup / MFA / redirect allowlist | Not readable via SQL advisors; **manual dashboard checklist remaining** |

### Dashboard checklist (developer)

- [ ] Public email signup disabled (single-owner CMS)
- [ ] Email confirmations / password policy / MFA for owner
- [ ] Redirect URL allowlist = production + local only
- [ ] Anonymous sign-in off
- [ ] Unexpected OAuth providers off
- [ ] Both auth users are expected; remove obsolete accounts
- [ ] Enable leaked-password protection
- [ ] Browser key is anon/publishable only; secret key server-only in Vercel
- [ ] Preview deployments do not receive production service role / Mux secrets unless required

## Environment variables (names only)

From `.env.example` (values empty; `.env*` gitignored except example):

| Name | Intended audience |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser (alias) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server / scripts |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | Server |
| `MUX_WEBHOOK_SECRET` / `MUX_WEBHOOK_SIGNING_SECRET` | Server |
| `NEXT_PUBLIC_SITE_URL` | Browser (canonical + Mux CORS fallback) |
