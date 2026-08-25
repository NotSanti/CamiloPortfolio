-- Phase 1: portfolio CMS foundation
-- Tables: projects, project_images, project_videos
-- RLS: public read published only; authenticated CMS admin full manage

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  slug text not null unique,
  description text,

  -- Required by existing public UI (photo vs video project views)
  kind text not null,
  constraint projects_kind_check check (kind in ('photo', 'video')),

  cover_image_path text,
  cover_width integer,
  cover_height integer,

  is_published boolean not null default false,
  is_featured boolean not null default false,

  display_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_is_published_idx on public.projects (is_published);
create index projects_display_order_idx on public.projects (display_order);
create index projects_is_featured_idx on public.projects (is_featured)
  where is_featured = true;

create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- project_images
-- ---------------------------------------------------------------------------

create table public.project_images (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null
    references public.projects (id)
    on delete cascade,

  storage_path text not null,

  alt_text text,
  caption text,

  width integer,
  height integer,

  display_order integer not null default 0,

  created_at timestamptz not null default now()
);

create index project_images_project_id_display_order_idx
  on public.project_images (project_id, display_order);

-- ---------------------------------------------------------------------------
-- project_videos
-- ---------------------------------------------------------------------------

create table public.project_videos (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null
    references public.projects (id)
    on delete cascade,

  mux_asset_id text,
  mux_playback_id text,

  status text not null default 'waiting',
  constraint project_videos_status_check
    check (status in ('waiting', 'uploading', 'processing', 'ready', 'errored')),

  title text,
  caption text,

  display_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_videos_project_id_display_order_idx
  on public.project_videos (project_id, display_order);

create trigger project_videos_set_updated_at
  before update on public.project_videos
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.project_videos enable row level security;

-- projects: public may only read published rows
create policy "Public can read published projects"
  on public.projects
  for select
  to anon, authenticated
  using (is_published = true);

-- projects: authenticated CMS admin may read all (including drafts)
create policy "Authenticated can read all projects"
  on public.projects
  for select
  to authenticated
  using (true);

create policy "Authenticated can insert projects"
  on public.projects
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update projects"
  on public.projects
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete projects"
  on public.projects
  for delete
  to authenticated
  using (true);

-- project_images: public read only when parent project is published
create policy "Public can read images of published projects"
  on public.project_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = project_images.project_id
        and projects.is_published = true
    )
  );

create policy "Authenticated can read all project images"
  on public.project_images
  for select
  to authenticated
  using (true);

create policy "Authenticated can insert project images"
  on public.project_images
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update project images"
  on public.project_images
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete project images"
  on public.project_images
  for delete
  to authenticated
  using (true);

-- project_videos: public read only when parent project is published
create policy "Public can read videos of published projects"
  on public.project_videos
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = project_videos.project_id
        and projects.is_published = true
    )
  );

create policy "Authenticated can read all project videos"
  on public.project_videos
  for select
  to authenticated
  using (true);

create policy "Authenticated can insert project videos"
  on public.project_videos
  for insert
  to authenticated
  with check (true);

create policy "Authenticated can update project videos"
  on public.project_videos
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete project videos"
  on public.project_videos
  for delete
  to authenticated
  using (true);
