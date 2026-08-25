# Phase 13 — Video migration report

Generated: 2026-08-25  
Status: **complete** (legacy placeholders on Mux)

## Summary

| Metric | Value |
| --- | --- |
| Source file | `public/media/videos/CardinTest2.mp4` (3,967,611 bytes) |
| Legacy rows remapped | 7 |
| Shared Mux asset | `wP01TRk7AX2ddE47NWxoE2K2y6bpIIPbSzOOuMPw0001Os` |
| Shared playback ID | `Q300BKxqCjoFmkus8hI009i1d1BDa2sAKPYPhgr9PdbUg` |
| Failures | 0 (after remapping without duplicate `mux_upload_id`) |

## Strategy

- All seeded videos pointed at the same local MP4 placeholder.
- Uploaded **once** to Mux, then linked every legacy `project_videos` row to that asset/playback ID.
- `mux_upload_id` is unique — only the first remapped row stores it; others share asset/playback only.
- Preserved `display_order` and titles.
- Left `source_path` populated for rollback until visual verification.
- Did **not** delete `public/media/videos/CardinTest2.mp4`.
- Skipped CMS uploads already on Mux (e.g. `vidtest1`).

## Project mapping

| Slug | Playback ID |
| --- | --- |
| night-motion | `Q300BKxqCjoFmkus8hI009i1d1BDa2sAKPYPhgr9PdbUg` |
| frame-rate | `Q300BKxqCjoFmkus8hI009i1d1BDa2sAKPYPhgr9PdbUg` |
| cutaway | `Q300BKxqCjoFmkus8hI009i1d1BDa2sAKPYPhgr9PdbUg` |
| pulse-line | `Q300BKxqCjoFmkus8hI009i1d1BDa2sAKPYPhgr9PdbUg` |
| signal-loss | `Q300BKxqCjoFmkus8hI009i1d1BDa2sAKPYPhgr9PdbUg` |
| runway-dust | `Q300BKxqCjoFmkus8hI009i1d1BDa2sAKPYPhgr9PdbUg` |
| static-bloom | `Q300BKxqCjoFmkus8hI009i1d1BDa2sAKPYPhgr9PdbUg` |

## Still local

- `public/media/videos/CardinTest2.mp4` — keep until homepage + `/work/[slug]` look correct
- `data/projects.ts` seed helpers still reference `/media/videos/…`

## Artifacts

- Script: `scripts/migrate-videos-to-mux.mjs` (`npm run migrate:videos`)
- Manifest: `docs/phase-13-migration-manifest.json`

## Follow-ups

- Spot-check video projects (Mux player on public site).
- After verification, optionally null `source_path` and delete the local MP4.
- Unique future footage should create one Mux asset per row (not shared).
