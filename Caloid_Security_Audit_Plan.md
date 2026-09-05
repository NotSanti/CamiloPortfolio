# Caloid Portfolio — Incremental Security Audit & Hardening Plan

**Target repository:** `NotSanti/CamiloPortfolio`  
**Production site:** `https://www.caloid.com/`  
**Primary stack:** Next.js / React / TypeScript / Supabase / Mux / Vercel  
**Purpose:** Give an AI coding agent (Cursor) a strict, incremental process to audit, exploit-test safely, fix, and regression-test security issues without making large uncontrolled changes.

---

## 0. Agent Operating Rules

You are performing a **defensive security audit of this repository and its own development/test environment**.

### Core rules

1. **Do not make broad refactors while auditing.**
2. Work in small phases:
   1. identify issue,
   2. prove or disprove exploitability safely,
   3. add a failing regression test when feasible,
   4. apply the smallest secure fix,
   5. run the focused test,
   6. run the full test suite,
   7. document the result,
   8. then move to the next issue.
3. **Never print real secrets** into:
   - terminal logs,
   - test snapshots,
   - markdown reports,
   - browser console,
   - CI output,
   - source files.
4. Never use production service-role credentials in tests.
5. Do not perform destructive testing against production.
6. Prefer:
   - local Supabase,
   - mocked integrations,
   - test accounts,
   - test buckets,
   - disposable Mux/dev resources.
7. Do not weaken RLS, auth, validation, or webhook verification merely to make tests pass.
8. Treat all user-controlled values as hostile until proven otherwise.
9. Do not assume middleware/proxy protection is sufficient for API endpoints. **Sensitive API routes must authorize at the route/service boundary as well.**
10. Do not consider an issue fixed unless a regression test exists where technically reasonable.
11. After every phase, update `docs/security-audit-results.md`.
12. If a critical/high-severity issue is found, fix it before moving to medium/low issues.
13. If an actual secret is discovered in current code or git history:
    - do not reproduce it in output,
    - report only secret type + location,
    - remove exposure,
    - rotate/revoke the secret,
    - invalidate affected sessions/tokens when relevant,
    - then verify the old secret no longer works.

---

# 1. Required Audit Deliverables

Create and maintain:

```text
docs/security-audit-results.md
docs/security-route-matrix.md
docs/security-supabase-matrix.md
```

Where appropriate, also create security-focused tests under the repository's existing test conventions.

Do **not** introduce a second test framework if one already exists.

The final report must classify each finding:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFO
PASS
```

Each finding must contain:

```text
ID
Severity
Component
File(s)
Attack surface
Preconditions
Observed behavior
Expected secure behavior
Proof/test
Fix
Regression test
Residual risk
Status
```

---

# 2. Phase 0 — Establish Baseline Before Changing Code

## 2.1 Inspect project configuration

Read:

```text
package.json
package-lock.json
next.config.*
vercel.json
tsconfig.json
eslint.config.*
.env.example
.gitignore
proxy.ts / middleware.ts
supabase/config.toml
```

Also locate any:

```text
vitest.config.*
jest.config.*
playwright.config.*
.github/workflows/*
Dockerfile*
```

### Record

- Next.js version
- React version
- Supabase client packages
- Mux packages
- authentication libraries
- validation libraries
- test framework
- runtime versions
- deployment runtime
- server vs edge routes
- lint/typecheck/test commands

## 2.2 Run baseline quality gates

Run the project's existing equivalents of:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

Do not blindly run `npm audit fix --force`.

Record existing failures separately from security work.

### Acceptance gate

Do not begin security refactors until you know which failures existed beforehand.

---

# 3. Phase 1 — Full Attack-Surface Inventory

This phase is mandatory. **Do not rely on the route list in this document alone.**

## 3.1 Enumerate every Next.js API route

Search dynamically for:

```text
app/**/route.ts
app/**/route.tsx
pages/api/**
src/**/route.ts
```

Also search for exported handlers:

```text
export async function GET
export async function POST
export async function PUT
export async function PATCH
export async function DELETE
export async function OPTIONS
export async function HEAD
```

At the time this plan was written, known API groups include:

```text
app/api/mux/uploads
app/api/webhooks/mux
```

But treat that list only as a starting point.

Create `docs/security-route-matrix.md`:

| Route | Methods | Public? | Authentication | Authorization | Input validation | External service | DB access | Service key? | Rate limited? | CSRF concern? | Tests |
|---|---|---:|---|---|---|---|---|---:|---:|---:|---|

Every route must appear exactly once.

## 3.2 Enumerate every Server Action

Search for:

```text
"use server"
'use server'
```

Treat each server action like an API route.

For each action determine:

- who may invoke it,
- whether auth is checked server-side,
- whether admin authorization is checked,
- whether IDs are trusted from the client,
- what database mutations occur,
- whether it invokes Mux/storage,
- whether validation exists.

Add each action to the route/action matrix.

## 3.3 Enumerate all Supabase client construction

Search for every:

```text
createClient(
createBrowserClient(
createServerClient(
SUPABASE_
NEXT_PUBLIC_SUPABASE_
service_role
sb_secret_
sb_publishable_
anon
```

Also inspect all files under likely locations such as:

```text
src/lib/supabase/**
lib/supabase/**
app/**/*
scripts/**
```

Classify every client instance:

```text
BROWSER_ANON / PUBLISHABLE
SERVER_USER_SESSION
SERVER_ADMIN / SERVICE ROLE / SECRET
SCRIPT_ONLY
TEST_ONLY
```

Record:

| File | Client type | Key source | Executes in browser? | Carries user session? | Bypasses RLS? | Appropriate? |
|---|---|---|---:|---:|---:|---:|

### Hard rule

A service-role or Supabase secret key must never be importable into a Client Component or browser bundle.

---

# 4. Phase 2 — Secrets, Credentials, Private Data, and Git History

Do this before auth changes because a leaked admin credential makes other protections irrelevant.

## 4.1 Scan current working tree

Search for likely secrets:

```text
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SECRET
MUX_TOKEN_SECRET
MUX_WEBHOOK_SECRET
DATABASE_URL
POSTGRES_PASSWORD
JWT_SECRET
PRIVATE_KEY
BEGIN PRIVATE KEY
api_key
apikey
secret
password
token
Authorization:
Bearer
```

Inspect:

```text
.env*
*.pem
*.key
*.p12
*.pfx
*.json
vercel*.json
scripts/**
docs/**
README*
```

Determine whether each discovered value is:

- placeholder,
- public identifier,
- publishable/anon credential,
- real private credential.

Do not treat a Supabase publishable/anon key as equivalent to a private server secret, but confirm RLS makes its exposure safe.

## 4.2 Scan git history

Run a history-aware scanner if available, preferably:

```bash
gitleaks detect --source . --log-opts="--all"
```

Optionally supplement with:

```bash
trufflehog git file://. --only-verified
```

Also manually inspect history for:

```text
.env
.env.local
service_role
MUX_TOKEN_SECRET
DATABASE_URL
PRIVATE KEY
```

### If a real historical secret is found

1. Mark the finding HIGH or CRITICAL depending on capability.
2. Rotate it immediately in the provider.
3. Remove it from current source.
4. Consider git history rewriting only after rotation.
5. Update Vercel/Supabase/Mux environment values.
6. redeploy.
7. verify old credential rejection.
8. never paste the leaked value into the report.

## 4.3 Inspect client bundle exposure

Search compiled output and browser-accessible JS for names and secret-like patterns.

At minimum verify that these never reach client code:

```text
SUPABASE_SERVICE_ROLE_KEY
Supabase secret key
MUX_TOKEN_SECRET
MUX_WEBHOOK_SECRET
DATABASE_URL
```

Add an automated regression test/script that scans generated client assets for forbidden environment variable names and known test canary values.

### Test strategy

During test/build only, inject fake canary secrets:

```text
TEST_SERVICE_ROLE_CANARY_DO_NOT_SHIP
TEST_MUX_SECRET_CANARY_DO_NOT_SHIP
```

Build the app and assert these strings do not exist in publicly served JS assets.

---

# 5. Phase 3 — Authentication Boundary

## 5.1 Audit admin login

Locate:

- login page,
- sign-in handler,
- auth callback,
- session refresh logic,
- logout,
- password reset if enabled.

Verify:

- login errors do not leak unnecessary account-existence information,
- sessions are server-validated where authorization matters,
- logout invalidates expected local session state,
- redirects cannot be turned into open redirects,
- admin pages cannot be cached publicly,
- protected content is not included in unauthenticated server responses.

## 5.2 Audit `proxy.ts` / middleware

Current code should be treated as **UI/page protection, not the sole API authorization layer**.

Verify:

- all intended admin pages are covered,
- matcher syntax behaves as expected,
- unauthenticated requests redirect correctly,
- authenticated users do not gain permissions solely because they are authenticated,
- API security does not depend exclusively on the proxy matcher.

### Tests

Add focused tests for:

```text
anonymous -> /admin => redirected/rejected
valid admin -> /admin => allowed
authenticated non-admin -> /admin => rejected
expired session -> /admin => rejected
malformed auth cookies -> rejected safely
```

If non-admin users are not yet supported, create a test fixture for one anyway.

---

# 6. Phase 4 — Fix Authorization Model Before Other CMS Work

This is a priority phase.

## Problem to explicitly investigate

Look for Supabase policies equivalent to:

```sql
TO authenticated
USING (true)
WITH CHECK (true)
```

For CMS writes, this frequently means:

> any authenticated Supabase account == administrator

That must not be the authorization model unless it is an intentional and rigorously enforced single-account system.

## 6.1 Create explicit admin authorization

Choose one maintainable model.

Preferred simple option for this portfolio:

```sql
public.admin_users (
  user_id uuid primary key references auth.users(id)
)
```

Then centralize authorization with a helper such as:

```sql
public.is_admin()
```

Requirements:

- use `auth.uid()`,
- use a fixed `search_path`,
- minimize SECURITY DEFINER use,
- revoke unnecessary execute privileges,
- avoid user-controlled role metadata for authorization unless cryptographically/server controlled.

Example concept:

```sql
exists (
  select 1
  from public.admin_users
  where user_id = auth.uid()
)
```

## 6.2 Replace broad CMS write policies

For every mutable CMS table, anonymous/public users must never gain writes.

Audit at minimum all existing project-related tables, including:

```text
projects
project_images
project_videos
site_settings
```

and dynamically enumerate every table created by migrations.

Desired permission concept:

| Actor | Published project read | Draft read | Insert | Update | Delete |
|---|---:|---:|---:|---:|---:|
| anon | YES | NO | NO | NO | NO |
| authenticated non-admin | same as public unless needed | NO | NO | NO | NO |
| admin | YES | YES | YES | YES | YES |
| service backend | only where intentionally needed | only where needed | controlled | controlled | controlled |

## 6.3 Add RLS regression tests

Use local Supabase if possible.

Create fixtures:

```text
anonymous client
authenticated non-admin user
authenticated admin user
service/admin test client
```

For **every table**, test SELECT/INSERT/UPDATE/DELETE independently.

Examples:

```text
anon cannot SELECT draft project
anon can SELECT published project
anon cannot INSERT project
non-admin auth user cannot SELECT drafts
non-admin auth user cannot INSERT
non-admin auth user cannot UPDATE
non-admin auth user cannot DELETE
admin can SELECT drafts
admin can INSERT
admin can UPDATE
admin can DELETE
```

Also test relational leakage:

```text
anon cannot query image metadata belonging to draft project
anon cannot query video metadata belonging to draft project
```

### Important

Do not mock RLS for these tests. At least one integration test suite must execute against a real local/test Supabase/Postgres instance.

---

# 7. Phase 5 — Audit Every Supabase Migration

Inspect **every file** under:

```text
supabase/migrations/**
```

At the time this plan was created, the repo contained migrations covering:

```text
portfolio CMS foundation
updated_at search_path fix
interim media fields
seed portfolio projects
portfolio media storage bucket
Mux upload ID
site settings portrait
site/project SEO
```

Re-enumerate these from disk rather than assuming this list is complete.

For each migration check:

## 7.1 RLS

Every application table exposed through Supabase APIs should deliberately choose whether RLS is enabled.

Search for:

```sql
enable row level security
disable row level security
create policy
alter policy
drop policy
```

Flag:

- table reachable via PostgREST with RLS disabled,
- `USING (true)` write access,
- `WITH CHECK (true)` write access,
- accidental `TO public`,
- authenticated-wide admin privileges,
- policies with cross-table bypasses.

## 7.2 Functions and triggers

Search:

```sql
create function
create or replace function
security definer
security invoker
set search_path
execute
grant
revoke
```

For every `SECURITY DEFINER` function:

- confirm it is genuinely necessary,
- pin `search_path`,
- schema-qualify objects,
- restrict EXECUTE privileges,
- validate parameters,
- confirm no privilege escalation.

## 7.3 Grants

Search:

```sql
grant all
grant insert
grant update
grant delete
grant execute
grant usage
to anon
to authenticated
to public
```

Apply least privilege.

## 7.4 Constraints/data integrity

Security-sensitive constraints should be database-backed where reasonable:

- ownership/admin relationships,
- valid foreign keys,
- cascade behavior,
- unique slugs,
- nullable sensitive fields,
- valid media references.

## 7.5 Seeds

Ensure seed migrations contain no:

- personal credentials,
- production secrets,
- private email/password pairs,
- API tokens,
- confidential metadata.

---

# 8. Phase 6 — Supabase Dashboard / Hosted Instance Audit

Repository SQL is not sufficient. Compare it against the **actual Supabase project configuration**.

If Cursor cannot access the Supabase dashboard directly, generate a checklist for the developer to verify manually and record results.

## 8.1 Authentication settings

Verify:

- whether public email signup is enabled,
- whether email confirmations are required,
- enabled OAuth providers,
- anonymous sign-ins,
- magic link behavior,
- password policy,
- MFA availability,
- redirect URL allowlist,
- site URL,
- JWT/session expiry configuration.

For a single-owner CMS:

- strongly consider disabling self-service signup,
- maintain only explicitly approved admin users,
- enable MFA for the owner/admin.

## 8.2 User inventory

Review `auth.users`.

Confirm:

- every user is expected,
- obsolete test accounts are removed,
- no unknown users exist,
- admin membership is explicit,
- new authenticated users do not become admins automatically.

## 8.3 Database exposure

In the hosted DB, verify:

```text
RLS enabled on all expected tables
policies match repository migrations
no dashboard-created policy drift
no unexpected schemas/tables exposed
no permissive grants
```

Run SQL to inventory:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public';
```

And policy inventory:

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Record the output structurally, but do not copy private row data into reports.

## 8.4 Functions

Inventory:

```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public';
```

Review all security-definer functions manually.

## 8.5 API keys

Verify:

- browser receives only anon/publishable key,
- backend secret/service key exists only in server environment,
- old unused keys are revoked when possible,
- secrets are not duplicated unnecessarily,
- separate server secret keys are preferred when supported.

If migrating to Supabase's newer key model is appropriate, prefer a **publishable key in browser code** and a **secret key in backend code**, while retaining the same RLS assumptions.

## 8.6 Network/database connection strings

Confirm:

- direct Postgres passwords are not exposed publicly,
- connection strings are server-only,
- Vercel environment scopes are correct,
- preview deployments do not expose production secrets unnecessarily.

---

# 9. Phase 7 — Supabase Storage Audit

Dynamically enumerate buckets and policies.

Known media storage should be specifically reviewed.

## 9.1 Bucket visibility

For each bucket answer:

```text
Should every object be public forever?
Should drafts be private?
Should unpublished client work be private?
Are originals different from thumbnails?
```

If drafts/unpublished work must remain confidential, do not rely on obscure object paths.

Use either:

```text
separate public/private buckets
```

or:

```text
private bucket + signed URLs
```

## 9.2 Storage RLS

Test these actors:

```text
anonymous
authenticated non-admin
admin
```

For each bucket test:

```text
list/read
upload
overwrite
delete
move
```

Ensure authenticated non-admin users cannot mutate storage merely because they have a Supabase account.

## 9.3 Upload restrictions

Validate:

- MIME type,
- extension,
- file size,
- object path,
- allowed bucket,
- overwrite semantics.

Do not trust browser `accept=` filters.

Server/storage policies must enforce important restrictions where possible.

### Security test cases

Attempt:

```text
oversized upload
unexpected MIME type
double extension
SVG containing script if SVG is accepted
HTML disguised as image
path traversal-style names
overwrite of another object's path
delete of another object's path
```

Tests should use controlled local/test storage only.

---

# 10. Phase 8 — API Route Audit: `POST /api/mux/uploads`

This route gets priority because it creates an external paid-resource capability.

## 10.1 Authentication

The route itself must validate a current Supabase user/session.

Test:

```text
no cookie/session => 401
malformed session => 401
expired session => 401
valid non-admin => 403
valid admin => proceeds
```

Do not rely only on `/admin` proxy protection.

## 10.2 Authorization

Check explicit admin membership.

Do not treat:

```text
user != null
```

as equivalent to:

```text
user is authorized CMS administrator
```

## 10.3 Object-level authorization

For provided `projectId`:

- project must exist,
- admin must be authorized to modify it,
- reject malformed UUIDs before querying when appropriate.

## 10.4 Input validation

Use a schema validator if already present.

Validate:

```text
projectId
title
corsOrigin
any optional metadata
```

Reject:

```text
unknown properties if useful
oversized strings
invalid URLs
unexpected origins
null/type confusion
```

## 10.5 CORS origin

Do not blindly trust a client-provided `corsOrigin`.

Prefer deriving/allowlisting legitimate production and local development origins.

Test:

```text
https://www.caloid.com => allowed
known local dev origin => allowed in development
https://evil.example => rejected
javascript:... => rejected
malformed => rejected
```

## 10.6 Abuse / resource exhaustion

Because successful calls can create Mux resources:

- add reasonable rate limiting,
- consider per-user and IP controls,
- avoid duplicate upload creation on retries where feasible,
- log request outcome without logging credentials.

Test burst behavior at a safe local/mocked level.

## 10.7 Error handling

External Mux errors must not expose:

```text
Mux token IDs/secrets
stack traces
internal environment values
raw provider responses containing sensitive details
```

Return bounded generic errors to clients.

## 10.8 Tests

At minimum add unit/integration tests covering:

```text
401 anonymous
403 non-admin
400 invalid body
400 invalid project ID
400/403 malicious origin
404 unknown project if appropriate
200/201 admin happy path
Mux client not called for rejected requests
DB mutation not called for rejected requests
provider error sanitized
rate limit enforced if added
```

Use mocks for Mux in unit tests.

---

# 11. Phase 9 — API Route Audit: Mux Webhook

Treat the webhook as intentionally unauthenticated by user session but authenticated by Mux signature.

## 11.1 Signature verification

Must verify the **raw body** with Mux's supported verifier before trusting event contents.

Test:

```text
missing signature => 401/400
invalid signature => rejected
tampered body => rejected
valid signature => accepted
```

Do not parse and reconstruct the body before signature validation if the signature algorithm requires exact raw bytes.

## 11.2 Event allowlist

Only process event types the application expects.

Unknown event types:

- acknowledge safely if appropriate,
- make no DB changes.

## 11.3 Idempotency

Webhooks may be retried.

Ensure duplicate delivery does not:

- duplicate records,
- regress state,
- create repeated side effects.

Add an idempotency test with the same event delivered twice.

## 11.4 Record binding

Never update an arbitrary DB row purely because an event contains a client-controlled identifier.

Validate linkage among:

```text
Mux upload ID
Mux asset ID
project video record
project
```

Ensure an attacker cannot use a legitimate signed event for one upload to mutate unrelated rows.

## 11.5 Service-role use

If the webhook uses an RLS-bypassing Supabase client:

- initialize it in a server-only module,
- never export it to browser-compatible modules,
- keep mutations narrowly scoped,
- validate event before all DB writes.

## 11.6 Error handling

Do not leak provider secrets or DB details.

Decide carefully whether transient failures should return a retryable non-2xx response.

## 11.7 Tests

Add tests for:

```text
invalid signature
missing signature
tampered payload
valid expected event
valid unexpected event
duplicate event
missing DB target
event-to-record mismatch
DB failure
no secret leakage in response
```

---

# 12. Phase 10 — Audit Every CMS Mutation / Server Action

Search all project CRUD and settings operations.

For each mutation answer:

1. Where is authentication checked?
2. Where is admin authorization checked?
3. Does RLS independently protect the operation?
4. Is input validated?
5. Can the user modify records by changing an ID in the request?
6. Can a non-admin call the function directly?
7. Is mass assignment possible?
8. Are unexpected fields ignored/rejected?
9. Are database errors sanitized?
10. Are destructive actions protected from accidental duplicate submission?

## Tests per mutation

For each create/update/delete action:

```text
anonymous denied
non-admin denied
admin succeeds
invalid input denied
unknown record handled safely
extra privileged fields cannot be injected
RLS still blocks direct Supabase bypass attempt
```

---

# 13. Phase 11 — IDOR / Object-Level Authorization

Systematically inspect every place receiving:

```text
projectId
videoId
imageId
slug
storage path
uploadId
assetId
```

Never assume that possession of an identifier implies authorization.

For every mutation/read of non-public content:

```text
load target
verify authorization
perform operation
```

### Tests

Create:

```text
Project A
Project B
```

Attempt to use a request intended for A with B's identifiers.

Although this is a single-owner CMS, the test protects future account expansion.

---

# 14. Phase 12 — Input Validation and Injection Review

Search for all usage of:

```text
request.json()
request.formData()
searchParams
params
headers
cookies
dangerouslySetInnerHTML
innerHTML
eval
new Function
exec
spawn
raw SQL
rpc
```

## 14.1 SQL injection

Supabase query-builder usage is normally parameterized, but inspect:

- RPC functions,
- dynamic filters,
- raw SQL,
- migration functions,
- scripts.

Never concatenate user strings into SQL commands.

## 14.2 XSS

CMS-controlled fields are still untrusted.

Inspect fields such as:

```text
title
description
credits
SEO title
SEO description
alt text
captions
URLs
```

Test malicious payloads like harmless inert strings representing:

```html
<script>alert(1)</script>
<img src=x onerror=alert(1)>
```

Do not execute real payloads against production.

If rich HTML is supported, sanitize with a vetted sanitizer and allowlist.

If rich HTML is not required, render text as text.

## 14.3 URL validation

For configurable links:

- require expected schemes,
- reject `javascript:`,
- reject unsafe `data:` unless explicitly needed,
- validate external media/embed URLs.

---

# 15. Phase 13 — CSRF and Browser Request Security

For cookie-authenticated state-changing routes/actions, evaluate CSRF.

Confirm:

- Supabase session cookie SameSite behavior,
- route method semantics,
- Origin/Referer checks where justified,
- no state change on GET,
- CORS does not allow arbitrary credentialed origins.

For sensitive custom POST endpoints, consider validating:

```text
Origin == expected site origin
```

in addition to auth.

Tests:

```text
cross-site hostile Origin
missing Origin where browser normally supplies it
valid production Origin
valid local development Origin
```

---

# 16. Phase 14 — Security Headers

Inspect deployed response headers and Next configuration.

Add/tune where compatible:

```text
Strict-Transport-Security
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy
Content-Security-Policy
```

Consider clickjacking protection via CSP:

```text
frame-ancestors
```

Prefer CSP over relying solely on legacy `X-Frame-Options`.

## CSP process

Do not deploy an overly broad policy like:

```text
script-src *
script-src 'unsafe-eval' *
```

Inventory actual requirements for:

```text
self
Next.js
Supabase
Mux
images
video
fonts
analytics if present
```

Start with report-only if necessary, then enforce.

### Tests

Add header tests that assert production/server responses contain the expected headers.

---

# 17. Phase 15 — Next.js Image / External Host Restrictions

Audit `next.config.*`.

Avoid unnecessarily broad remote patterns such as:

```text
*.supabase.co
```

if the application only uses one known project hostname.

Allowlist only required:

```text
protocol
hostname
pathname
```

Also inspect any Mux image/video domains actually required.

Add a configuration-level test where practical, or document as a static security assertion.

---

# 18. Phase 16 — Dependencies and Supply Chain

Run:

```bash
npm audit
npm outdated
```

Review high/critical findings manually.

Also inspect:

- abandoned packages,
- unnecessary packages,
- install scripts,
- packages with filesystem/network/build privileges.

Do not upgrade the entire dependency tree at once.

Upgrade incrementally:

```text
security-critical patch
test
build
commit
next package
```

## Lockfile

Require committed lockfile and reproducible CI installs:

```bash
npm ci
```

---

# 19. Phase 17 — Information Leakage

Search production behavior for:

```text
stack traces
database errors
Supabase errors
Mux errors
internal IDs
environment variable names
absolute filesystem paths
source maps
debug endpoints
console.log secrets
```

Inspect:

```text
404
500
API validation errors
webhook errors
login errors
```

Responses may contain actionable error codes but should not reveal sensitive internals.

### Tests

Force mocked provider/DB failures and assert responses do not contain:

```text
service role key
Mux secret
DATABASE_URL
stack trace
node_modules paths
SQL query text
```

---

# 20. Phase 18 — Public Data / Privacy Review

Enumerate every field returned to anonymous visitors.

For each public table/view determine whether the browser genuinely needs the field.

Watch for:

```text
internal database IDs
draft fields
private notes
upload IDs
provider asset metadata
admin identifiers
email addresses
storage internals
timestamps that reveal private workflow
```

Do not rely solely on UI omission.

Query public Supabase endpoints with an anon client and inspect the raw response.

Add tests confirming draft/private columns and rows cannot be fetched.

---

# 21. Phase 19 — Rate Limiting / Abuse Controls

Prioritize endpoints with cost or write impact:

```text
login
Mux direct-upload creation
contact form if one exists later
other mutation APIs
```

Use platform-supported rate limiting or a durable store suitable for Vercel/serverless.

Do not rely on an in-memory Map for production rate limiting across serverless instances.

Test:

```text
normal requests succeed
threshold exceeded => 429
Retry-After where appropriate
rate-limit key does not trust spoofable headers blindly
```

---

# 22. Phase 20 — Logging and Auditability

Security logs should record enough to investigate abuse without storing secrets.

For admin mutations consider logging:

```text
authenticated user ID
action
target record ID
timestamp
success/failure category
request correlation ID
```

Do not log:

```text
access tokens
refresh tokens
authorization headers
service keys
Mux secrets
raw passwords
full signed upload credentials
```

If an admin audit table is introduced, protect it with strict RLS.

---

# 23. Phase 21 — File/Media Security

For all uploads:

- enforce sensible maximum sizes,
- enforce allowed media categories,
- reject executable/document content not needed,
- decide whether SVG is allowed,
- verify generated URLs do not create open proxy behavior,
- ensure image optimization endpoints cannot fetch arbitrary internal URLs.

If user-provided remote image URLs are supported, assess SSRF.

Do not permit the server to fetch arbitrary URLs without a strict allowlist.

---

# 24. Phase 22 — Open Redirects

Search for:

```text
redirect(
NextResponse.redirect(
router.push(
window.location
returnTo
redirectTo
next=
```

Validate redirect destinations.

Test:

```text
/internal-admin-path => allowed
https://evil.example => rejected or normalized
//evil.example => rejected
encoded protocol-relative URL => rejected
```

---

# 25. Phase 23 — Deployment / Vercel Security

Review actual Vercel settings manually if not available in code:

- production env variables,
- preview env variables,
- development variables,
- team access,
- deployment protection,
- old deployments,
- logs,
- custom domain,
- HTTPS,
- branch deploy behavior.

Ensure secret credentials are not exposed to untrusted preview branches.

Review whether pull requests from forks can access secrets.

---

# 26. Phase 24 — GitHub Repository Security

Enable where available:

```text
secret scanning
push protection
Dependabot alerts
Dependabot security updates
branch protection
required CI
```

Ensure `.gitignore` protects:

```text
.env*
*.pem
*.key
.vercel
```

while intentionally allowing only safe example env files.

---

# 27. Phase 25 — Test Architecture to Add

Prefer three security test layers.

## Layer A — Unit tests

Use for:

```text
input validation
admin guard helpers
origin allowlists
error sanitization
Mux request wrapper
webhook event dispatch
redirect validation
```

Fast and heavily mocked.

## Layer B — Route integration tests

Execute actual route handlers with mocked external services but realistic auth/session behavior.

Test:

```text
401
403
400
success
provider failure
```

## Layer C — Supabase integration tests

Use local/test Supabase.

Do not mock authorization here.

Test actual:

```text
RLS
storage policies
admin membership
anon access
authenticated non-admin access
admin access
```

---

# 28. Security Test Helpers

Create reusable fixtures/helpers rather than duplicating auth setup.

Suggested conceptual helpers:

```text
createAnonSupabaseClient()
createAuthenticatedTestClient(user)
createAdminTestClient()
createNonAdminTestClient()
createMockMuxClient()
signMockMuxWebhook()
buildApiRequest()
```

Never embed production credentials.

---

# 29. Priority Fix Order

Cursor should execute the work in this order.

## P0 — Immediate

### Step 1: Secret exposure
- scan current tree,
- scan history,
- inspect client bundle,
- rotate anything real that leaked.

### Step 2: Mux upload route
- server-side authentication,
- explicit admin authorization,
- input validation,
- origin validation,
- rate limiting,
- regression tests.

### Step 3: Supabase admin authorization
- explicit admin model,
- remove authenticated-wide write permissions,
- RLS tests.

### Step 4: Storage authorization
- remove authenticated-wide write permissions,
- decide public-vs-private draft strategy,
- storage tests.

Do not proceed to lower priorities while a known P0 issue remains open.

## P1 — High value

### Step 5: Every remaining API route / Server Action
- enumerate,
- auth,
- authorization,
- validation,
- IDOR,
- error handling,
- tests.

### Step 6: Webhook hardening
- signature,
- event allowlist,
- idempotency,
- record binding,
- tests.

### Step 7: Hosted Supabase drift audit
- actual policies,
- users,
- auth settings,
- functions,
- grants,
- buckets.

## P2 — Defense in depth

### Step 8: CSP/security headers
### Step 9: rate limiting
### Step 10: dependency/security CI
### Step 11: logging/audit trail
### Step 12: deployment/GitHub hardening

---

# 30. Incremental Cursor Workflow

For **each individual security issue**, use this exact loop.

## A. Investigate

Write:

```text
Finding:
Severity:
Affected files:
Expected behavior:
Current behavior:
Attack precondition:
Worst credible impact:
```

## B. Reproduce safely

Create the smallest controlled proof.

No production data mutation.

## C. Write regression test first where feasible

The test should fail for the vulnerable behavior.

Example:

```text
"authenticated non-admin cannot create a Mux upload"
```

## D. Implement smallest fix

Avoid unrelated refactors.

## E. Run focused tests

Example:

```bash
npm test -- mux-upload
```

Use actual project syntax.

## F. Run broader gates

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## G. Update report

Mark:

```text
FIXED
VERIFIED
```

only after tests pass.

## H. Commit-sized checkpoint

Keep each logical security fix independently reviewable.

Then move to the next finding.

---

# 31. Required Route-by-Route Questions

Cursor must answer this checklist for **every API route and Server Action**:

```text
[ ] What actor is expected to call this?
[ ] Is it intentionally public?
[ ] Is authentication performed inside the trusted server boundary?
[ ] Is authorization separate from authentication?
[ ] Does it require admin permissions?
[ ] Does it accept an object/resource ID?
[ ] Is object-level authorization checked?
[ ] Is request input schema validated?
[ ] Are unknown fields allowed?
[ ] Are string lengths bounded?
[ ] Are URLs/origins validated?
[ ] Does it call Supabase?
[ ] Which Supabase client does it use?
[ ] Does that client bypass RLS?
[ ] Does it call Mux or another paid API?
[ ] Can the call be abused to create cost?
[ ] Is rate limiting required?
[ ] Is CSRF relevant?
[ ] Is CORS intentionally configured?
[ ] Are errors sanitized?
[ ] Are logs free of secrets?
[ ] Is retry/idempotency behavior safe?
[ ] Does a unit/integration test cover anonymous access?
[ ] Does a test cover non-admin access?
[ ] Does a test cover malformed input?
[ ] Does a test cover the success case?
```

No route is considered audited until all boxes are resolved.

---

# 32. Required Supabase Table-by-Table Questions

For **every public schema table/view**:

```text
[ ] Is RLS enabled where appropriate?
[ ] What can anon SELECT?
[ ] What can anon INSERT?
[ ] What can anon UPDATE?
[ ] What can anon DELETE?
[ ] What can authenticated non-admin SELECT?
[ ] What can authenticated non-admin INSERT?
[ ] What can authenticated non-admin UPDATE?
[ ] What can authenticated non-admin DELETE?
[ ] What can admin do?
[ ] Is access intentionally different for drafts?
[ ] Can relational joins leak draft/private data?
[ ] Are policies duplicated/conflicting?
[ ] Are there broad USING(true) policies?
[ ] Are there broad WITH CHECK(true) policies?
[ ] Are grants broader than policies imply?
[ ] Are SECURITY DEFINER functions involved?
[ ] Are integration tests proving the matrix?
```

---

# 33. Required Supabase Storage Bucket Questions

For every bucket:

```text
[ ] Public or private?
[ ] Is that intentional?
[ ] Can anonymous users list objects?
[ ] Can anonymous users download?
[ ] Can anonymous users upload/update/delete?
[ ] Can authenticated non-admin users upload?
[ ] Can authenticated non-admin users overwrite?
[ ] Can authenticated non-admin users delete?
[ ] Can admins perform required CMS operations?
[ ] Can draft content leak through public object URLs?
[ ] Are file size/type restrictions appropriate?
[ ] Are object paths predictable/sensitive?
[ ] Are signed URLs used when privacy is required?
[ ] Are policies covered by integration tests?
```

---

# 34. Definition of Done

The audit is not complete until all of the following are true:

```text
[ ] Every API route was enumerated and entered into the route matrix.
[ ] Every Server Action was enumerated and reviewed.
[ ] Every Supabase client instance was classified.
[ ] No service/secret key is browser-accessible.
[ ] Current source and full git history were secret-scanned.
[ ] Every Supabase migration was reviewed.
[ ] Every public table has an explicit access decision.
[ ] Every relevant table has RLS tests using real local/test Supabase.
[ ] Authenticated non-admin users cannot mutate CMS data.
[ ] Admin authorization is explicit.
[ ] Every storage bucket was reviewed.
[ ] Draft/private media exposure is intentional and documented.
[ ] Mux upload creation requires explicit authorization.
[ ] Mux webhook signature verification is tested.
[ ] Webhook replay/idempotency is tested.
[ ] Object-level authorization/IDOR was reviewed.
[ ] Input validation exists for all mutation endpoints.
[ ] Important paid/write endpoints have abuse controls.
[ ] Security headers were reviewed and implemented where appropriate.
[ ] Dependency vulnerabilities were reviewed.
[ ] Production errors do not leak secrets/internal stack traces.
[ ] Vercel environment-variable scopes were reviewed.
[ ] Hosted Supabase settings were compared with repository assumptions.
[ ] GitHub secret/dependency protections are enabled where available.
[ ] Full tests, lint, typecheck, and production build pass.
[ ] `docs/security-audit-results.md` contains no unresolved CRITICAL/HIGH findings.
```

---

# 35. Initial Findings to Verify First

These are hypotheses from the initial review and must be verified against the **current working tree** before modifying code.

## SEC-001 — Authenticated users may be over-authorized

**Priority:** P0 / HIGH

Inspect migrations for policies granting CMS read/write privileges to all `authenticated` users through unconditional policy expressions.

Target secure result:

```text
authenticated != administrator
```

Add a non-admin Supabase user test before changing policies.

---

## SEC-002 — Mux upload creation may lack route-level authorization

**Priority:** P0 / HIGH

Verify `app/api/mux/uploads/route.ts`.

The route must independently enforce:

```text
valid session
AND
explicit admin authorization
```

regardless of whether the UI lives under `/admin`.

Add negative tests first.

---

## SEC-003 — Public storage may expose unpublished media

**Priority:** P1 / MEDIUM, potentially HIGH for confidential client work

Verify whether `portfolio-media` is public and whether draft/unpublished assets are stored there.

Decide based on product requirements:

```text
public portfolio assets => public is acceptable
unpublished/confidential assets => private + signed access
```

Document the decision.

---

## SEC-004 — Broad external image host allowlist

**Priority:** P2 / LOW

Inspect Next.js remote image patterns.

If only one Supabase project is required, restrict the hostname to that project rather than all `*.supabase.co`.

---

## SEC-005 — Missing defense-in-depth security headers

**Priority:** P2 / MEDIUM

Inspect deployed headers and `next.config.*`.

Add/tune CSP and standard security headers with regression tests.

---

# 36. Final Report Format

When all phases are complete, `docs/security-audit-results.md` should finish with:

## Executive Summary

```text
Critical findings:
High findings:
Medium findings:
Low findings:
Fixed:
Accepted risk:
Remaining:
```

## Security posture

Rate separately:

```text
Secrets management
Authentication
Authorization
API security
Supabase RLS
Supabase Storage
Webhook security
Input validation
Browser security
Dependency security
Deployment security
Testing coverage
```

## Remaining risks

Be explicit. Do not claim the site is "secure" in absolute terms.

Prefer wording like:

> No known critical/high vulnerabilities remain within the reviewed scope as of <date>. The assessment does not guarantee absence of undiscovered vulnerabilities.

---

# 37. First Cursor Instruction

Start with this exact task:

> Perform **Phase 0, Phase 1, and Phase 2 only**. Do not modify application behavior yet. Enumerate every API route, Server Action, Supabase client, migration, table, storage bucket reference, environment variable, Mux integration, and authentication boundary. Create the three security audit documents defined above. Run the baseline quality gates and a full secret scan including git history. Then rank findings by severity. Stop before implementing fixes, except that if you discover a real currently valid private credential committed to the repository, immediately remove the exposure and flag that the credential must be rotated. Do not print secret values.

After that inventory is reviewed, proceed with:

> Fix the highest-severity finding only. First add a regression test proving the vulnerability when technically feasible, then implement the smallest fix, run focused tests, then the complete test/lint/typecheck/build gates, update the audit report, and stop before starting the next finding.

Repeat that second instruction one finding at a time.
