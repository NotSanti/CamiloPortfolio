# Phase 7 — Image migration report

Generated: 2026-08-25  
Status: **complete** (project images + covers on Supabase Storage)

## Summary

| Metric | Count |
| --- | ---: |
| Source file | `public/media/shoes1.jpeg` (1,164,856 bytes) |
| Gallery objects uploaded | 92 |
| Cover-only uploads (video projects) | 8 (+ 1 for `hidden-draft`) |
| Cover remaps | 29 / 29 |
| Gallery remaps | 92 local → Storage (+ 1 already on Storage kept) |
| Failures | 0 |
| DB path updates | applied via migrations |
| Temp anon upload policy | removed after run |

Verified public object: HTTP 200 for  
`…/storage/v1/object/public/portfolio-media/projects/…/gallery/…-shoes1.jpeg`

## Strategy

- Every seeded gallery/cover path pointed at the same placeholder JPEG.
- Uploaded one Storage object per gallery row under `projects/{projectId}/gallery/{imageId}-shoes1.jpeg`.
- Cover-only / video projects got a dedicated gallery-folder object used as `cover_image_path`.
- Preserved `display_order` and existing width/height/alt metadata.
- Did **not** delete local originals.
- Videos left on `/media/videos/...` for Mux / later phases.
- `montreal-editorial` cover (already Storage PNG) was left unchanged; its remaining local gallery rows were migrated.

## How to re-run

```bash
npm run migrate:images
# or dry-run:
node scripts/migrate-images-to-storage.mjs --dry-run
```

Prefer setting `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` so the script can update DB rows itself. Without it, the script uploads (if a temporary upload policy exists) and writes `docs/phase-7-path-updates.sql`.

## Still referenced locally

### `public/media/shoes1.jpeg`

- Kept on disk until visual verification (Phase 7 requirement)
- `data/projects.ts` seed helpers (reseed source only)
- `data/about.ts` `portraitSrc` (out of project CMS scope)
- Video posters in seed data until video/Mux phases

### `public/media/videos/CardinTest2.mp4`

- `project_videos.source_path` still `/media/videos/CardinTest2.mp4` (7 rows)
- Deferred to Mux / video storage phases

## Artifacts

- Script: `scripts/migrate-images-to-storage.mjs`
- Manifest: `docs/phase-7-migration-manifest.json`
- SQL remaps (applied): `docs/phase-7-path-updates.sql`

## Follow-ups

- Spot-check homepage + a few `/work/[slug]` pages (covers should load from `*.supabase.co`).
- After visual OK, optionally delete `public/media/shoes1.jpeg` in a later cleanup (keep about/seed until those are migrated).
- Phase 8: image CMS improvements (thumbnails, alt/caption edit, reorder, multi-upload polish).
