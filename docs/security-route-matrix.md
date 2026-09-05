# Security route / action matrix

Enumerated from the working tree on 2026-09-05. Every App Router route handler and `"use server"` export appears once. `proxy.ts` is not a route; it is recorded in the notes.

Authentication today means `supabase.auth.getUser()` (session present). Authorization is explicit CMS membership via `public.admin_users` / `requireAdminClient()` / `is_admin()` RLS (applied 2026-09-05).

## API routes

| Route | Methods | Public? | Authentication | Authorization | Input validation | External service | DB access | Service key? | Rate limited? | CSRF concern? | Tests |
|---|---|---:|---|---|---|---|---|---:|---:|---:|---|
| `/api/mux/uploads` | POST | No (intended admin) | Route handler does not check session. `createProjectVideoDirectUpload` calls `getUser()` and returns 401 if missing. Not covered by `proxy.ts` matcher. | None beyond `user != null`. No admin table / `is_admin()`. | Manual: JSON parse, `projectId` trim, `title` string, `corsOrigin` string. No UUID schema, no unknown-key reject, **client `corsOrigin` trusted**. | Mux Video `uploads.create` (paid ingest). | User-session client: `projects` select, `project_videos` insert/update/delete. | No (Mux tokens via `createMuxClient`; Supabase anon + cookies). | No | Yes — cookie session POST from browser. Origin is used for Mux CORS, not as an anti-CSRF allowlist. | None |
| `/api/webhooks/mux` | POST | Yes (Mux callback) | No user session. Authenticates with Mux webhook signature on **raw body** via `mux.webhooks.unwrap`. | N/A (provider signature). Event types allowlisted in `handleMuxWebhookEvent` default branch. | Relies on Mux unwrap. No extra schema. | Mux (verify only). | **Service-role** client: `project_videos` select/update. Binding: upload id, passthrough video id, asset id. | **Yes** — `createServiceClient()`. Also reads Mux token id/secret to construct the Mux client. | No (Mux retries). | No (no cookies). | None |

No `pages/api/**` routes. No other `app/**/route.ts` files.

Runtime: both handlers set `export const runtime = "nodejs"` (not Edge).

## Server Actions

Shared pattern unless noted: `"use server"` + duplicated `requireAuthedClient` / `requireUser` (`getUser()`, throw if missing). Mutations use the **user-session** Supabase client (RLS). No explicit admin membership check.

| Action | File | Intended actor | Public? | Auth (server) | Admin authz | Object ID | Input validation | External | DB / storage | Service key? | CSRF | Tests |
|---|---|---|---:|---|---|---|---|---|---|---:|---|---|
| `loginAction` | `src/services/auth/actions.ts` | Anonymous | Yes | Creates session | N/A | `next` path | Email/password required. Generic invalid-credentials message. `next` must start with `/admin` and not `//`. | Supabase Auth | Session cookies | No | Login CSRF possible if cookie SameSite is lax. | None |
| `logoutAction` | `src/services/auth/actions.ts` | Authenticated | No | `signOut()` | No | — | — | Supabase Auth | Session | No | Cookie POST | None |
| `setProjectPublishedAction` | `src/services/projects/admin-actions.ts` | Admin | No | `getUser()` | No | `projectId` | Boolean flag only | — | `projects` update | No | Server Action | None |
| `setProjectFeaturedAction` | `src/services/projects/admin-actions.ts` | Admin | No | `getUser()` | No | `projectId` | Boolean flag only | — | `projects` update | No | Server Action | None |
| `deleteProjectAction` | `src/services/projects/admin-actions.ts` | Admin | No | Via `deleteProjectWithMediaCleanup` | No | `projectId` | — | Mux asset delete; Storage remove | Project + media | No | Server Action | None |
| `updateProjectAction` | `src/services/projects/admin-actions.ts` | Admin | No | `getUser()` | No | `projectId` | Title/slug required; kind coerced photo/video | — | `projects` update | No | Server Action | None |
| `createProjectFromEditorAction` | `src/services/projects/admin-actions.ts` | Admin | No | `getUser()` | No | — | Title required; slug unique | — | `projects` insert | No | Server Action | None |
| `reorderProjectsAction` | `src/services/projects/admin-actions.ts` | Admin | No | `getUser()` | No | id list | Must match all existing ids | — | `projects` update | No | Server Action | None |
| `setCoverFromGalleryImageAction` | `src/services/images/admin-actions.ts` | Admin | No | `getUser()` | No | `projectId`, `imageId` | Image must belong to project | — | `projects` update | No | Server Action | None |
| `saveGalleryImageAction` | `src/services/images/admin-actions.ts` | Admin | No | `getUser()` | No | `projectId` | Path from client; no extra field allowlist | — | `project_images` insert; maybe cover | No | Server Action | None |
| `deleteGalleryImageAction` | `src/services/images/admin-actions.ts` | Admin | No | `getUser()` | No | `imageId` | — | Storage remove | `project_images` delete | No | Server Action | None |
| `updateGalleryImageMetaAction` | `src/services/images/admin-actions.ts` | Admin | No | `getUser()` | No | `projectId`, `imageId` | Trim alt/caption | — | image + maybe cover alt | No | Server Action | None |
| `reorderGalleryImagesAction` | `src/services/images/admin-actions.ts` | Admin | No | `getUser()` | No | `projectId`, ids | Must match all images for project | — | `project_images` update | No | Server Action | None |
| `updateVideoStatusAction` | `src/services/videos/admin-actions.ts` | Admin | No | `getUser()` | No | `videoId` | Status allowlist; rejects client `ready` | — | `project_videos` update | No | Server Action | None |
| `deleteProjectVideoAction` | `src/services/videos/admin-actions.ts` | Admin | No | `getUser()` | No | `videoId` | — | Mux delete if unshared | `project_videos` delete | No | Server Action | None |
| `savePortraitAction` | `src/services/site/admin-actions.ts` | Admin | No | `getUser()` | No | singleton | `isManagedStoragePath` | Storage remove old | `site_settings` update | No | Server Action | None |
| `updatePortraitAltAction` | `src/services/site/admin-actions.ts` | Admin | No | `getUser()` | No | singleton | Trim alt | — | `site_settings` update | No | Server Action | None |
| `saveSiteSeoAction` | `src/services/seo/admin-actions.ts` | Admin | No | `getUser()` | No | singleton | Length clipped | — | `site_settings` update | No | Server Action | None |
| `generateSiteSeoAction` | `src/services/seo/admin-actions.ts` | Admin | No | via save | No | — | Generated copy | — | `site_settings` | No | Server Action | None |
| `saveProjectSeoAction` | `src/services/seo/admin-actions.ts` | Admin | No | `getUser()` | No | `projectId` | Length clipped | — | `projects` update | No | Server Action | None |
| `generateProjectSeoAction` | `src/services/seo/admin-actions.ts` | Admin | No | `getUser()` | No | `projectId` | — | — | `projects` update | No | Server Action | None |
| `generateAllProjectSeoAction` | `src/services/seo/admin-actions.ts` | Admin | No | `getUser()` | No | all projects | — | — | bulk `projects` update | No | Server Action | None |
| `refreshSeoAction` | `src/services/seo/admin-actions.ts` | Admin | No | `getUser()` | No | — | — | cache revalidate | none | No | Server Action | None |
| `listMuxLibraryAction` | `src/services/videos/mux-library-actions.ts` | Admin | No | `getUser()` | No | `projectId` | Trim | Mux `assets.list` (account-wide) | `project_videos` usage | No | Server Action | None |
| `attachMuxAssetAction` | `src/services/videos/mux-library-actions.ts` | Admin | No | `getUser()` | No | `projectId`, `assetId` | Trim; project must exist | Mux retrieve / playback id | `project_videos` insert | No | Server Action | None |
| `hardDeleteMuxAssetAction` | `src/services/videos/mux-library-actions.ts` | Admin | No | `getUser()` | No | `assetId` | Trim | Mux `assets.delete` (destructive, paid-resource) | delete matching rows | No | Server Action | None |

## Related non-action modules (not routes)

| Module | Role |
|---|---|
| `src/services/videos/create-direct-upload.ts` | Called only from `/api/mux/uploads`. Session auth, no admin role, trusts `corsOrigin`, returns Mux/DB error strings to the client. |
| `src/services/videos/handle-mux-webhook.ts` | Called only from webhook route after signature unwrap. Service-role writes. Event allowlist + some idempotency. Passthrough id is trusted after signature (Mux-controlled). |
| `src/services/projects/delete-project.ts` | Called from `deleteProjectAction`. Session auth only. |
| `src/services/images/upload-client.ts` | Browser Client Component helper. Uploads to Storage with user access token + `x-upsert: true`. Relies on Storage RLS. |
| `src/services/videos/upload-client.ts` | Browser helper. POSTs to `/api/mux/uploads` with credentials (same origin) and `window.location.origin` as `corsOrigin`. |
| `proxy.ts` / `src/lib/supabase/proxy.ts` | Matcher `/admin` and `/admin/:path*` only. Redirects unauthenticated users to `/admin/login?next=…`. Sets `Cache-Control: private, no-store` on matched responses. **Does not protect API routes or Server Actions.** |

## Route-by-route checklist status

No route or action is marked fully audited until post-inventory fixes land. Gaps that apply to **every** mutation except `loginAction`:

- [x] Actor expected: CMS owner
- [ ] Intentionally public? No
- [x] Authentication inside trusted server boundary? Partial (`getUser()`)
- [ ] Authorization separate from authentication? **No**
- [ ] Explicit admin permissions? **No**
- [ ] Object-level authorization beyond RLS? Weak (IDs from client; RLS `USING (true)` for authenticated)
- [ ] Schema validation / unknown fields / bounded strings? Partial
- [ ] Mux paid-resource abuse controls? **No**
- [ ] Rate limiting? **No**
- [ ] Tests for anonymous / non-admin / malformed / success? **No test framework in repo**
