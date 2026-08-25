# CMS Existing Architecture Audit

Phase 0 deliverable. Read-only audit of the portfolio before Supabase/Mux/CMS work. No production code was changed for this document.

---

## 1. Framework & stack

| Item | Finding |
| --- | --- |
| Framework | **Next.js 16.2.10** App Router (`app/`) |
| UI | **React 19.2.4** + TypeScript (strict) |
| Styling | **Tailwind CSS 4** + tokens in `app/globals.css` |
| Image handling | `next/image` for stills |
| Video handling | Native `<video>` / `<source>` (no Mux, no player library) |
| Backend / API | **None** — no `app/api` routes |
| Auth | **None** |
| Supabase | **Not installed or configured** |
| Env files | **None** present (`.env*` is gitignored) |
| Hosting intent | Vercel (product docs); media currently in repo under `public/` |

Path alias: `@/*` → project root (`tsconfig.json`). Components live under `src/components`; mock content under root `data/` (not `src/data` as older AGENTS wording suggests).

Dependencies today: `next`, `react`, `react-dom` only. No data-fetching or CMS libraries.

---

## 2. Routing

| Route | Role |
| --- | --- |
| `/` | Home — featured media stream + brand header |
| `/work/[slug]` | Project detail (photo carousel or video stage) |
| `/about` | About / contact (static mock content) |

There is **no** `/work` index page. The full project list is a **client overlay** opened from the header (“Projects”), not a dedicated route.

Product brief also mentions `/contact` and `/admin`; neither exists yet. Contact lives on `/about`. `/admin` is the planned CMS entry (Phase 3+).

Project pages use:

- `generateStaticParams()` from `getAllProjectSlugs()`
- `generateMetadata()` from `getProjectBySlug()`
- `notFound()` when slug is missing

View choice is driven by `project.kind`:

- `"photo"` → `PhotoProjectView`
- `"video"` → `VideoProjectView`

---

## 3. Where project data lives

**Single source of truth:** `data/projects.ts`

Helpers:

- `getFeaturedProjects()` — filters `featured === true`
- `getProjectBySlug(slug)`
- `getAllProjectSlugs()`

**Types:** `types/projects.ts`

```ts
MediaType = "image" | "video"
ProjectKind = "photo" | "video"

MediaItem {
  id, type, src, alt, width, height, posterSrc?
}

Project {
  id, slug, title, category, kind, year, summary,
  featured, cover: MediaItem, media: MediaItem[]
}
```

**About content (out of project CMS scope for MVP):** `data/about.ts` — bio, slogan, portrait, contact links. Portrait currently reuses `/media/shoes1.jpeg`.

---

## 4. Current project inventory

| Metric | Count |
| --- | --- |
| Total projects | **28** |
| `kind: "photo"` | **21** |
| `kind: "video"` | **7** |
| `featured: true` | **All 28** (hardcoded in `project()` helper) |
| Publish/draft | **Not modeled** — every project is public |

Slugs (preserve for URL continuity):

`montreal-editorial`, `night-motion`, `studio-texture`, `coastal-light`, `frame-rate`, `urban-grain`, `quiet-rooms`, `field-notes`, `red-hour`, `glass-lines`, `soft-focus`, `cutaway`, `open-road`, `after-image`, `steel-horizon`, `pulse-line`, `paper-weight`, `cold-front`, `signal-loss`, `drywall`, `late-shift`, `amber-hold`, `runway-dust`, `mirror-pool`, `northbound`, `static-bloom`, `flatline`, `cargo-bay`

IDs are string literals (`project-1` … `project-28`), not UUIDs.

Array order in `projects` is the only ordering mechanism (no `display_order` field).

---

## 5. Current media paths

### On disk (`public/`)

| Path | Approx. size | Role |
| --- | --- | --- |
| `public/media/shoes1.jpeg` | ~1.1 MB | Placeholder for **all** project covers, gallery images, video posters, and about portrait |
| `public/media/videos/CardinTest2.mp4` | ~3.8 MB | Placeholder for **all** project videos |

Static UI assets (keep in repo under CMS plan §3.2): fonts under `public/fonts/`, icons under `public/icons/`, miscellaneous SVGs.

### In data

Every `image()` helper sets `src: "/media/shoes1.jpeg"`.  
Every `video()` helper sets `src: "/media/videos/CardinTest2.mp4"` and `posterSrc: "/media/shoes1.jpeg"`.

Aspect ratios differ per item via hardcoded `width` / `height` in `SIZES` — dimensions are layout-critical even though the file is shared.

---

## 6. Fields used by the UI vs unused metadata

| Field | Used in UI / behavior? |
| --- | --- |
| `id` | Keys, overlay positioning seed |
| `slug` | Routes, links (`/work/[slug]`) |
| `title` | Header, overlay titles, metadata, aria |
| `kind` | Chooses photo vs video detail view; home tile video vs still |
| `featured` | Homepage stream (`getFeaturedProjects`) |
| `cover` | Home tiles (src, alt, aspect) |
| `media` | Detail galleries / video src; home video tiles find first `type === "video"` |
| `summary` | `generateMetadata` description only |
| `category` | **Not rendered** in components today |
| `year` | **Not rendered** in components today |

No credits, client, location, SEO fields, or captions beyond `MediaItem.alt`.

---

## 7. Affected components & data flow

```text
data/projects.ts
      │
      ├── app/page.tsx → getFeaturedProjects() → HomeShell → FeaturedProjects → MediaTile
      │
      ├── app/layout.tsx → projects (ALL) → ProjectsProvider → ProjectsOverlay (titles + links)
      │
      └── app/work/[slug]/page.tsx → getProjectBySlug()
              ├── PhotoProjectView (images only from media[])
              └── VideoProjectView (first video in media[] + cover/poster)
```

| File | Consumption |
| --- | --- |
| `app/page.tsx` | Featured list for home stream |
| `app/layout.tsx` | Passes **entire** `projects` array into client `ProjectsProvider` |
| `app/work/[slug]/page.tsx` | Detail + SSG params + metadata |
| `src/components/home/home-shell.tsx` | Composes header + hero + featured |
| `src/components/home/featured-projects.tsx` | Animated stream of `MediaTile` |
| `src/components/media/media-tile.tsx` | Cover image; optional muted looping `<video>` for `kind === "video"` |
| `src/components/work/projects-provider.tsx` | Overlay open state; holds project list |
| `src/components/work/projects-overlay.tsx` | Title links only (`id`, `slug`, `title`) |
| `src/components/project/photo-project-view.tsx` | Image carousel / expanded view (`MediaItem` images) |
| `src/components/project/video-project-view.tsx` | Full-viewport autoplay muted loop |
| `src/components/layout/site-header.tsx` | Opens projects overlay; shows project title on detail |
| `src/lib/media-tile-size.ts` | Display sizes from `width`/`height` |

About path is independent: `data/about.ts` → `app/about/page.tsx` → `AboutPageView`.

---

## 8. Data-access patterns today

- Synchronous imports from `data/projects.ts` (no fetch, no cache tags, no server actions).
- Homepage loads featured projects on the server, then hydrates a large client stream.
- Root layout serializes **all** projects (including full `media[]`) into the client provider for the overlay — even though the overlay only needs `id` / `slug` / `title`.
- No separation of public vs admin queries (admin does not exist).

Environment variable convention for Next.js (when Phase 1 adds them):

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server only
MUX_TOKEN_ID=                       # server only
MUX_TOKEN_SECRET=                   # server only
MUX_WEBHOOK_SECRET=                 # server only
```

(Do not use the plan’s Vite-style `VITE_*` names in this repo.)

---

## 9. Migration risks

1. **Placeholder media, real metadata** — Seeding titles/slugs/dimensions is straightforward; visual fidelity after Storage/Mux migration depends on replacing the shared JPEG/MP4 with real assets (or accepting placeholders until then).

2. **Unified `media[]` vs planned separate tables** — The UI already treats photo and video projects differently (`kind` + filter/`find`). Separate `project_images` / `project_videos` matches current behavior. A unified `project_media` table is **not** required for MVP (no interleaved image/video galleries on one page today).

3. **`kind` is required for routing UI** — Planned MVP `projects` schema does not include `kind` / `project_type`. Without it, `/work/[slug]` cannot choose `PhotoProjectView` vs `VideoProjectView`. **Recommend adding `kind` (or equivalent) in Phase 1.**

4. **Featured vs published** — Today everything is featured and public. CMS needs `is_published` + `is_featured`. Seed migration should set both `true` for current projects so the public site stays unchanged.

5. **Ordering** — Preserve `data/projects.ts` array index as `display_order` (0…n). Do not switch to `created_at`.

6. **IDs** — Move to UUID primary keys in Postgres; keep stable **slugs** for URLs. Map old string ids only if needed for one-time seed scripts.

7. **Layout payload** — Replacing mock data with DB must not keep shipping full galleries to the client overlay. Overlay should query a thin list (`id`, `slug`, `title`, `display_order`); home stream needs cover (+ video poster/playback for featured video tiles).

8. **SSG / dynamic data** — `generateStaticParams` and static project pages assume a fixed list. After Supabase, revisit ISR/`revalidate` or dynamic rendering so CMS publish changes appear without redeploy (Phase 2+).

9. **Dimensions** — `width`/`height` drive aspect ratios across home, carousel, and filmstrip. Persist them on image rows (already in planned `project_images`). Covers need dimensions too (cover is currently a full `MediaItem`).

10. **Video posters** — `posterSrc` exists today; Mux-generated posters can replace this later. Until then, store an optional poster path or rely on cover.

11. **About portrait** — Same placeholder file; treat as separate content (not part of project tables) unless a later CMS phase covers site settings.

12. **AGENTS.md path mismatch** — Docs say `src/data`; actual mock data is `data/`. Prefer updating docs when CMS services land rather than moving files mid-migration.

---

## 10. Recommended mapping to planned Supabase tables

### `projects`

| Existing `Project` | Planned / recommended column | Notes |
| --- | --- | --- |
| — | `id` uuid | New; replace `project-N` |
| `slug` | `slug` | Keep unique; preserve all current slugs |
| `title` | `title` | |
| `summary` | `description` | Used for metadata today |
| `cover` → path | `cover_image_path` | Storage path after Phase 6/7; seed can start as URL/path string |
| — | `is_published` | Seed `true` for all 28 |
| `featured` | `is_featured` | Seed `true` for all 28 |
| array index | `display_order` | `0` … `27` matching current array |
| `kind` | **`kind` text** (`photo` \| `video`) | **Add — required by existing UI** |
| `year` | optional `year` | Not rendered; omit unless CMS/editor wants it soon |
| `category` | optional / derive from `kind` | Not rendered; omit for MVP |
| — | `created_at` / `updated_at` | Plan defaults |

Cover dimensions: either store `cover_width` / `cover_height` on `projects`, or treat the cover as the first managed image and keep path + dimensions together. Simplest MVP fit: add nullable `cover_width` / `cover_height` on `projects`, or encode dimensions only on a cover row in storage metadata — prefer explicit columns if cover stays on `projects`.

### `project_images`

| Existing | Column |
| --- | --- |
| `MediaItem.id` | new uuid `id` |
| parent project | `project_id` |
| `src` | `storage_path` (after migration; Phase 2 may keep public URL temporarily) |
| `alt` | `alt_text` |
| — | `caption` null |
| `width` / `height` | `width` / `height` |
| index in `media` (images only) | `display_order` |

Only `type === "image"` entries in `media[]` (not the cover, unless cover is also duplicated in `media` — today cover is separate; gallery is `media` images only).

### `project_videos`

| Existing | Column |
| --- | --- |
| `MediaItem.id` | new uuid `id` |
| parent project | `project_id` |
| — | `mux_asset_id` / `mux_playback_id` null until Mux |
| — | `status` — seed `ready` only after Mux; for static interim use a path strategy or keep serving `/media/videos/...` until Phase 12–13 |
| `alt` | `title` or caption |
| index in `media` (videos) | `display_order` |
| `posterSrc` | optional later `custom_poster_path`; interim: cover or static poster |

Video projects today have **one** video in `media[]`. Home tiles and detail views assume a single primary video.

### Application query mapping (later phases)

| Current | Public CMS era |
| --- | --- |
| `getFeaturedProjects()` | `getPublishedProjects()` filtered by `is_featured` (or dedicated query) — covers only for list/stream |
| `getProjectBySlug()` | `getPublishedProjectBySlug(slug)` + related images/videos |
| `getAllProjectSlugs()` | published slugs only |
| `projects` in layout | thin published list for overlay titles |

Admin counterparts (`getAllProjects`, etc.) must not be reused on the public site.

---

## 11. Suggested service-layer fit (when implementing)

Respect existing layout; do not force a new folder style blindly. Practical fit:

```text
src/lib/supabase/          # clients (browser / server)
src/services/projects/      # getPublishedProjects, getPublishedProjectBySlug, admin CRUD
src/services/images/
src/services/videos/
types/                      # keep domain types; add DB-generated types later
```

Presentation components should keep receiving props shaped like today’s `Project` / `MediaItem` (or a thin adapter) so `MediaTile`, photo/video views, and overlay stay stable during Phases 1–2.

---

## 12. Phase readiness summary

| Topic | Status |
| --- | --- |
| Public UI structure | Stable enough for CMS backend work |
| Mock project model | Clear; maps cleanly with one schema addition (`kind`) |
| Real per-project media | Not yet — shared placeholders only |
| Supabase / Mux / admin | Not started |
| Immediate next step | **Phase 1 — Supabase foundation** (migrations, RLS, clients, types; no UI change, no content migration yet) |

---

## 13. Uncertainties / decisions for Phase 1

1. Confirm adding **`kind`** (`photo` | `video`) on `projects` (recommended).
2. Confirm whether **`year`** / **`category`** belong in MVP schema or stay omitted until the CMS editor needs them.
3. Confirm cover dimension storage approach (`cover_width`/`cover_height` vs other).
4. Confirm whether about-page portrait remains hardcoded through project CMS MVP (recommended: yes).
