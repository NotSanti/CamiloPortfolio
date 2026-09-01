-- Singleton site settings: about-page portrait (CMS-managed)

create table public.site_settings (
  id text primary key default 'default',
  constraint site_settings_singleton check (id = 'default'),

  portrait_path text,
  portrait_alt text,
  portrait_width integer,
  portrait_height integer,

  updated_at timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row
  execute function public.set_updated_at();

alter table public.site_settings enable row level security;

grant select on table public.site_settings to anon, authenticated;
grant update on table public.site_settings to authenticated;

create policy "Public can read site settings"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

create policy "Authenticated can update site settings"
  on public.site_settings
  for update
  to authenticated
  using (true)
  with check (true);

insert into public.site_settings (id, portrait_alt)
values ('default', 'Camilo Luna portrait');
