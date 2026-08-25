-- Phase 9: store Mux direct-upload id for webhook correlation (Phase 11).

alter table public.project_videos
  add column if not exists mux_upload_id text;

create unique index if not exists project_videos_mux_upload_id_uidx
  on public.project_videos (mux_upload_id)
  where mux_upload_id is not null;
