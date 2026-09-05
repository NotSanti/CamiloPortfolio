-- Explicit CMS administrators. authenticated != administrator.

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon, authenticated, public;
grant select on table public.admin_users to authenticated;

-- A user may read only their own membership row (enough for app-layer checks).
create policy "Users can read own admin membership"
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Keep current operators working; new Auth users do not become admins.
insert into public.admin_users (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated can read all projects" on public.projects;
drop policy if exists "Authenticated can insert projects" on public.projects;
drop policy if exists "Authenticated can update projects" on public.projects;
drop policy if exists "Authenticated can delete projects" on public.projects;

create policy "Admins can read all projects"
  on public.projects
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert projects"
  on public.projects
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update projects"
  on public.projects
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete projects"
  on public.projects
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- project_images
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated can read all project images" on public.project_images;
drop policy if exists "Authenticated can insert project images" on public.project_images;
drop policy if exists "Authenticated can update project images" on public.project_images;
drop policy if exists "Authenticated can delete project images" on public.project_images;

create policy "Admins can read all project images"
  on public.project_images
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert project images"
  on public.project_images
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update project images"
  on public.project_images
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete project images"
  on public.project_images
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- project_videos
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated can read all project videos" on public.project_videos;
drop policy if exists "Authenticated can insert project videos" on public.project_videos;
drop policy if exists "Authenticated can update project videos" on public.project_videos;
drop policy if exists "Authenticated can delete project videos" on public.project_videos;

create policy "Admins can read all project videos"
  on public.project_videos
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert project videos"
  on public.project_videos
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update project videos"
  on public.project_videos
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete project videos"
  on public.project_videos
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- site_settings
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated can update site settings" on public.site_settings;

create policy "Admins can update site settings"
  on public.site_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Least privilege: anon must not have table-level writes even if RLS is the
-- primary control. authenticated keeps DML; policies restrict it to admins.
revoke insert, update, delete, truncate, references, trigger
  on table public.projects from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.project_images from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.project_videos from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.site_settings from anon;

revoke truncate, references, trigger on table public.projects from authenticated;
revoke truncate, references, trigger on table public.project_images from authenticated;
revoke truncate, references, trigger on table public.project_videos from authenticated;
revoke truncate, references, trigger on table public.site_settings from authenticated;
