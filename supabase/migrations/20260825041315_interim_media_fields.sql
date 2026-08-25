-- Interim fields for Phase 2 static media (before Storage/Mux migration)
alter table public.projects
  add column if not exists cover_alt_text text;

alter table public.project_videos
  add column if not exists source_path text;
