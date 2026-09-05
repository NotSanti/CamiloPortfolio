# Caloid security audit results

**Repository:** `NotSanti/CamiloPortfolio`  
**Production:** `https://www.caloid.com/`  
**Audit date (inventory):** 2026-09-05  
**Fixes applied:** 2026-09-05 (code + hosted CaloidDB migrations)  
**Scope this document:** Phases 0–2 inventory plus incremental P0–P2 hardening.

Do not treat this file as a guarantee of security. Findings use the severity scale CRITICAL / HIGH / MEDIUM / LOW / INFO / PASS.

---

## Executive summary (after incremental fixes)

```text
Critical findings: 0
High findings:     0 open
Medium findings:   SEC-003 (public draft object URLs — accepted residual)
                   SEC-012 (hosted Auth dashboard settings — owner action)
Low findings:      SEC-010 login rate limit (Mux uploads are limited)
                   SEC-013 GitHub secret scanning / Dependabot (enable in GitHub UI)
Fixed:             SEC-000, SEC-001, SEC-002, SEC-003 writes, SEC-004, SEC-005,
                   SEC-006, SEC-007, SEC-008, SEC-009, SEC-011, SEC-014, SEC-015
Accepted risk:     Public `portfolio-media` bucket for published portfolio assets;
                   unpublished objects remain fetchable by URL (UUID paths).
Remaining:         Deploy this build to Vercel. Confirm Auth signup is disabled,
                   MFA, leaked-password protection, and both Auth users are expected.
```

No known critical/high vulnerabilities remain within the reviewed scope as of 2026-09-05. The assessment does not guarantee absence of undiscovered vulnerabilities. Hosted policy changes are live on CaloidDB; Next.js header/CSP/app changes apply after the next production deploy.

---

## Phase 0 — Baseline

### Stack

| Item | Value |
|---|---|
| Next.js | 16.3.3 (App Router; `proxy.ts` not `middleware.ts`) |
| React | 19.2.4 |
| Node engines | `22.x` (local `v22.14.0`) |
| TypeScript | ^5, `strict: true` |
| Tailwind | v4 |
| Supabase | `@supabase/ssr` ^0.12.5, `@supabase/supabase-js` ^2.112.4 |
| Mux | `@mux/mux-node` ^15, `@mux/mux-player-react` ^3.13.2, `@mux/upchunk` ^3.5.0 |
| Auth | Supabase Auth email/password (`signInWithPassword`) |
| Validation library | Manual helpers in `src/lib/security/*` (no Zod) |
| Test framework | Vitest 3 (`npm test`) — added during this audit |
| CI | `.github/workflows/ci.yml` (`npm ci`, typecheck, test) |
| Deployment | Vercel (`vercel.json` framework `nextjs` only) |
| Lint | `npm run lint` → `eslint` |
| Typecheck | `npm run typecheck` → `tsc --noEmit` |
| Server vs Edge | API routes `runtime = "nodejs"` |

### Quality gates (pre-existing, not introduced by this audit)

| Gate | Inventory (before) | After fixes |
|---|---|---|
| `npm run lint` | Fail — `typed-text.tsx` React hook rules (pre-existing, not security) | Unchanged |
| `npm run typecheck` | Pass (`tsc --noEmit`) | Pass |
| `npm test` | Missing | **22 passing** Vitest tests |
| `npm run build` | Not run at inventory | Pass (Next.js 16.3.3) |
| `npm audit` | 4 High | **0 vulnerabilities** (`npm audit fix`, no `--force`) |

Do not use `npm audit fix --force`.

---

## Phase 2 — Secrets

| Scan | Result |
|---|---|
| Working tree | `.env.example` placeholders only. `.gitignore` ignores `.env*` except example, `*.pem`, `.vercel`. `.env.local` exists locally and is untracked. |
| Git history | Only `.env.example` added. Pickaxe for `SUPABASE_SERVICE_ROLE_KEY=` / `MUX_TOKEN_SECRET=` hits docs/example files, not live values. No `BEGIN PRIVATE KEY` / `sb_secret_`. `gitleaks` / `trufflehog` not installed. |
| Client bundle | `.next/static` has **no** `SUPABASE_SERVICE_ROLE_KEY`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET`, or `DATABASE_URL` strings. |
| Seed SQL | No credentials. |

No currently valid private credential was found in the repository. **No rotation performed.**

---

## Findings (ranked)

### SEC-001 — Authenticated users are administrators

| Field | Value |
|---|---|
| ID | SEC-001 |
| Severity | **HIGH** (P0) |
| Component | Supabase RLS + all CMS Server Actions |
| File(s) | `supabase/migrations/20260825035054_portfolio_cms_foundation.sql`, `supabase/migrations/20260901001456_site_settings_portrait.sql`, `src/services/**/admin-actions.ts`, `src/services/projects/admin.ts`, `src/services/site/admin.ts`, `src/services/videos/mux-library-actions.ts`, `src/services/projects/delete-project.ts` |
| Attack surface | PostgREST + Server Actions + Storage, using any valid `authenticated` JWT |
| Preconditions | Attacker can create or obtain a Supabase Auth user (signup if enabled, or a second of the two existing hosted users) |
| Observed behavior | Policies `TO authenticated USING (true) WITH CHECK (true)` on CMS writes. App guards only check `user != null`. Hosted DB matches. |
| Expected secure behavior | `authenticated != administrator`. Writes and draft reads require `admin_users` / `is_admin()`. |
| Proof/test | Policy inventory on hosted `CaloidDB` (expressions `true`). Code review of `requireAuthedClient`. |
| Fix | `admin_users` table, `is_admin()`, RLS rewrite, `requireAdminClient()`, proxy + CMS layout checks. Hosted migration `admin_authorization` applied. Existing Auth users bootstrapped into `admin_users`. |
| Regression test | `src/lib/auth/require-admin.test.ts` |
| Residual risk | Both pre-existing Auth users were bootstrapped as admins. Confirm both are expected. Disable public signup in the dashboard. |
| Status | **FIXED / VERIFIED** (hosted RLS live; app-layer live after deploy) |

### SEC-002 — Mux upload route lacks admin authorization, origin allowlist, and abuse controls

| Field | Value |
|---|---|
| ID | SEC-002 |
| Severity | **HIGH** (P0) |
| Component | `POST /api/mux/uploads` |
| File(s) | `app/api/mux/uploads/route.ts`, `src/services/videos/create-direct-upload.ts` |
| Attack surface | Cookie-authenticated POST; not in `proxy.ts` matcher. Creates Mux direct uploads (cost). |
| Preconditions | Any authenticated user (see SEC-001). Unauthenticated → 401 from service, not from the route itself. |
| Observed behavior | Session required. `corsOrigin` taken from JSON body or `Origin` header without allowlist. Mux/Postgres errors returned to client. No rate limit. |
| Expected | Valid session **and** explicit admin; allowlisted origin; generic errors; rate limit. |
| Proof/test | Code review |
| Fix | `requireAdminClient` (401/403), UUID check, origin allowlist (hostile `Origin` is fail-closed), durable rate limit via recent `project_videos` inserts, generic errors. |
| Regression test | `src/lib/security/mux-upload.test.ts`, `src/services/videos/mux-uploads-route.test.ts`; local POST with `Origin: https://evil.example` → 400 |
| Residual risk | Rate limit is global (8/min), not per IP. Fine for single-admin CMS. |
| Status | **FIXED / VERIFIED** |

### SEC-003 — Storage writes for any authenticated user; public bucket holds unpublished media

| Field | Value |
|---|---|
| ID | SEC-003 |
| Severity | **HIGH** for writes (P0); **MEDIUM** for unpublished object URLs (P1) |
| Component | Supabase Storage `portfolio-media` |
| File(s) | `supabase/migrations/20260825045009_portfolio_media_storage_bucket.sql`, `src/services/images/upload-client.ts` |
| Attack surface | Storage API with authenticated JWT; public object URLs |
| Preconditions | Auth user for writes. For reads: knowledge of object path or list via SELECT policy `TO public`. |
| Observed | Authenticated insert/update/delete on the bucket. Bucket is public. Drafts share the bucket. |
| Expected | Only admins mutate storage. Unpublished/confidential media private or accepted-and-documented. |
| Proof/test | Hosted policies + public bucket flag |
| Fix | Storage write policies require `is_admin()`. Hosted migration `storage_admin_write_policies` applied. Public read retained for `next/image`. |
| Regression test | Covered by admin membership tests + policy inventory on hosted DB |
| Residual risk | **Accepted:** public bucket; unpublished objects remain reachable by URL. UUID prefixes reduce guessing. Do not store confidential client work here without a private bucket. |
| Status | **FIXED** (writes). Draft URL exposure **accepted residual**. |

### SEC-006 — Mux library / hard-delete are session-only paid-resource controls

| Field | Value |
|---|---|
| ID | SEC-006 |
| Severity | **HIGH** (P0, same root cause as SEC-001) |
| Component | Server Actions |
| File(s) | `src/services/videos/mux-library-actions.ts` |
| Attack surface | `listMuxLibraryAction`, `attachMuxAssetAction`, `hardDeleteMuxAssetAction` |
| Preconditions | Authenticated user |
| Observed | Any auth user can list the whole Mux account, attach assets, **permanently delete Mux assets**. |
| Expected | Admin-only |
| Proof/test | Code review |
| Fix | Same `requireAdminClient` as SEC-001 |
| Regression test | `require-admin.test.ts` |
| Residual risk | — |
| Status | **FIXED / VERIFIED** |

### SEC-007 — Table GRANTs are far broader than RLS

| Field | Value |
|---|---|
| ID | SEC-007 |
| Severity | **MEDIUM** |
| Component | Postgres grants |
| File(s) | Hosted grants; foundation migration (default privileges) |
| Attack surface | PostgREST |
| Preconditions | RLS bypass bug or new table without RLS |
| Observed | `anon` has INSERT/UPDATE/DELETE/TRUNCATE on CMS tables; RLS currently blocks writes. |
| Expected | Least privilege: anon SELECT only. |
| Proof/test | `information_schema.role_table_grants` on hosted DB |
| Fix | Revoke anon DML + truncate/trigger/references; authenticated truncate/trigger/references revoked. Applied on hosted DB. |
| Regression test | Hosted grant inventory after `admin_authorization` |
| Residual risk | authenticated still has INSERT/UPDATE/DELETE grants; RLS `is_admin()` is the write brake. |
| Status | **FIXED / VERIFIED** |

### SEC-005 — Missing security headers / CSP

| Field | Value |
|---|---|
| ID | SEC-005 |
| Severity | **MEDIUM** (P2) |
| Component | `next.config.ts`, `proxy.ts` |
| File(s) | `next.config.ts`, `vercel.json` |
| Attack surface | Browser |
| Preconditions | None |
| Observed | No HSTS, nosniff, Referrer-Policy, Permissions-Policy, CSP, or `frame-ancestors`. Proxy matcher is admin-only so it cannot set site-wide CSP nonces without expanding the matcher (would force dynamic rendering). |
| Expected | Defense-in-depth headers; CSP that allowlists self, Supabase project host, Mux, Vercel Analytics — not `script-src *`. |
| Proof/test | Config review |
| Fix | `src/lib/security/headers.ts` + `next.config.ts` `headers()`. CSP allowlists the project Supabase host, Mux, Vercel Analytics. `script-src` still includes `'unsafe-inline'` (no nonce; avoids forcing dynamic rendering on the visual site). |
| Regression test | `src/lib/security/headers.test.ts`; local production server response headers |
| Residual risk | Nonce-based strict CSP not used (performance). Production will pick this up on deploy. Vercel already sent HSTS. |
| Status | **FIXED / VERIFIED** (local). **Pending deploy** to www.caloid.com. |

### SEC-008 — Public API returns Mux internal identifiers

| Field | Value |
|---|---|
| ID | SEC-008 |
| Severity | **MEDIUM** |
| Component | Public project detail query |
| File(s) | `src/services/projects/get-published-projects.ts` (`PROJECT_DETAIL_SELECT`) |
| Attack surface | Anon PostgREST + RSC payload |
| Preconditions | Published project with videos |
| Observed | Select includes `mux_asset_id`, `mux_upload_id` |
| Expected | Public DTO: playback id / display fields only |
| Proof/test | Code review |
| Fix | `PROJECT_DETAIL_SELECT` no longer selects `mux_asset_id` / `mux_upload_id` |
| Regression test | Typecheck + public mapper still compiles without those fields |
| Residual risk | Playback ids remain public by design. Anon PostgREST can still select those columns on published rows unless a column grant/view is added later. |
| Status | **FIXED** (RSC/app path). Residual: PostgREST column exposure. |

### SEC-009 — Webhook and Mux errors can leak provider messages

| Field | Value |
|---|---|
| ID | SEC-009 |
| Severity | **MEDIUM** |
| Component | Mux webhook + upload route |
| File(s) | `app/api/webhooks/mux/route.ts`, `src/services/videos/create-direct-upload.ts` |
| Attack surface | HTTP error JSON |
| Preconditions | Invalid signature, missing env, Mux/DB failure |
| Observed | `err.message` returned; missing webhook secret returns the env helper message (includes `MUX_WEBHOOK_SECRET` **name**). Upload path returns Mux exception text. |
| Expected | Bounded generic client errors; details in server logs without secrets. |
| Proof/test | Code review |
| Fix | Webhook returns generic `webhookClientError` strings. Mux upload uses `publicErrorMessage`. |
| Regression test | `webhook-errors.test.ts`, `mux-upload.test.ts` |
| Residual risk | — |
| Status | **FIXED / VERIFIED** |

### SEC-004 — Broad Next.js image remotePatterns

| Field | Value |
|---|---|
| ID | SEC-004 |
| Severity | **LOW** (P2) |
| Component | `next.config.ts` |
| File(s) | `next.config.ts` |
| Attack surface | `/_next/image` optimizer |
| Preconditions | Attacker can cause the app to request an image URL (limited if only CMS-controlled URLs are passed) |
| Observed | `hostname: "*.supabase.co"` |
| Expected | Single project hostname |
| Proof/test | Config review. Hosted project host is public (`*.supabase.co` project ref). |
| Fix | `remotePatterns` uses `NEXT_PUBLIC_SUPABASE_URL` hostname plus render-image path when set. |
| Regression test | `headers.test.ts` (CSP host); build uses `.env.local` host |
| Residual risk | Builds without the env var still fall back to `*.supabase.co`. Mux `image.mux.com` required. |
| Status | **FIXED / VERIFIED** |

### SEC-010 — No rate limiting on login or paid APIs

| Field | Value |
|---|---|
| ID | SEC-010 |
| Severity | **MEDIUM** (P2; Mux portion is P0 via SEC-002) |
| Component | Auth + Mux |
| File(s) | `src/services/auth/actions.ts`, mux upload route |
| Attack surface | Login spraying; Mux upload creation |
| Observed | No limiter; in-memory maps would be wrong on Vercel anyway |
| Expected | Durable limiter (DB or platform) |
| Status | **PARTIAL** — Mux uploads: 8 creates / 60s via `project_videos.created_at`. Login still unlimited. |

### SEC-011 — npm audit High findings

| Field | Value |
|---|---|
| ID | SEC-011 |
| Severity | **MEDIUM** (dev-tooling) / **LOW–MEDIUM** for runtime `nanoid` |
| Component | Dependencies |
| File(s) | `package-lock.json` |
| Observed | High advisories; fix available via `npm audit fix` without `--force` |
| Expected | Patch security-critical deps incrementally |
| Status | **FIXED / VERIFIED** — `npm audit` reports 0 vulnerabilities |

### SEC-012 — Hosted Auth leaked-password protection off; dashboard settings unverified

| Field | Value |
|---|---|
| ID | SEC-012 |
| Severity | **MEDIUM** |
| Component | Hosted Supabase Auth |
| File(s) | Dashboard (not in repo) |
| Observed | Advisor WARN `auth_leaked_password_protection`. Signup/MFA/redirect allowlist not confirmed in code. |
| Expected | Disable public signup; MFA; leaked-password protection; tight redirect URLs. |
| Status | **OPEN** (dashboard — owner must click: disable signup, MFA, leaked-password protection, review 2 users) |

### SEC-013 — No CI, no security tests, no GitHub protection-as-code

| Field | Value |
|---|---|
| ID | SEC-013 |
| Severity | **LOW** |
| Component | GitHub / Vercel |
| Observed | No workflows. Branch protection / secret scanning / Dependabot cannot be enabled from the app repo files alone. |
| Expected | `npm ci` in CI; Dependabot; secret scanning |
| Status | **PARTIAL** — `.github/workflows/ci.yml` added. Enable GitHub secret scanning, push protection, and Dependabot in the repo settings. |

### SEC-014 — `dangerouslySetInnerHTML` for JSON-LD

| Field | Value |
|---|---|
| ID | SEC-014 |
| Severity | **INFO** |
| Component | `src/components/seo/json-ld.tsx` |
| Observed | JSON.stringify with `<` → `\u003c`. CMS SEO fields are still untrusted if ever interpolated unsafely elsewhere (currently JSON-LD object built in code). |
| Expected | Keep text rendering for CMS strings; sanitizer only if rich HTML is added. |
| Status | **PASS** for current JSON-LD escaping; watch CMS XSS separately |

### SEC-015 — Login open-redirect hardening

| Field | Value |
|---|---|
| ID | SEC-015 |
| Severity | **LOW** |
| Component | `loginAction`, `app/admin/login/page.tsx`, proxy `next` param |
| Observed | `next` must start with `/admin` and not `//`. Same-origin path only. |
| Expected | Also reject backslashes, encoded slashes, `\\`, and non-path characters. |
| Fix | `safeAdminNextPath` in login page + `loginAction` |
| Regression test | `src/lib/security/safe-next-path.test.ts` |
| Status | **FIXED / VERIFIED** |

### SEC-000 — Secret exposure in git

| Field | Value |
|---|---|
| ID | SEC-000 |
| Severity | **PASS** |
| Component | Secrets |
| Observed | No live secrets in tree or history scans performed |
| Status | **PASS** |

---

## Executive summary (inventory snapshot)

The inventory snapshot above is historical. See the top-of-file executive summary for current status.

Highest-severity code fix after inventory was **SEC-001** (explicit admin model), then Mux, storage writes, headers, and supply chain.

---

## Security posture (after fixes)

| Area | Rating |
|---|---|
| Secrets management | Good in repo; service-role helpers split from browser `env-public.ts`. Client bundle scan clean. |
| Authentication | `getUser()` + generic login errors + safer `next` path |
| Authorization | Explicit `admin_users` / `is_admin()` on RLS, Server Actions, proxy, Mux route |
| API security | Mux: admin + origin allowlist + rate limit + sanitized errors. Webhook: signature + generic errors |
| Supabase RLS | Admin writes; anon published reads |
| Supabase Storage | Admin writes; public bucket for portfolio (draft URL residual) |
| Webhook security | Signature + allowlist + idempotency + sanitized errors |
| Input validation | UUID/origin/title bounds on Mux; still ad hoc on many Server Actions |
| Browser security | CSP + standard headers in `next.config.ts` (deploy to production still required) |
| Dependency security | `npm audit` clean after patch |
| Deployment security | CI added; Vercel preview secret scope and GitHub Dependabot still owner actions |
| Testing coverage | 22 Vitest tests; no local-Supabase RLS integration suite yet |
