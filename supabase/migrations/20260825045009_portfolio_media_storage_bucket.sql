-- Phase 6: portfolio image storage bucket + policies

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read (needed for next/image and public portfolio)
drop policy if exists "Public read portfolio media" on storage.objects;
create policy "Public read portfolio media"
  on storage.objects
  for select
  to public
  using (bucket_id = 'portfolio-media');

drop policy if exists "Authenticated upload portfolio media" on storage.objects;
create policy "Authenticated upload portfolio media"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'portfolio-media');

drop policy if exists "Authenticated update portfolio media" on storage.objects;
create policy "Authenticated update portfolio media"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'portfolio-media')
  with check (bucket_id = 'portfolio-media');

drop policy if exists "Authenticated delete portfolio media" on storage.objects;
create policy "Authenticated delete portfolio media"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'portfolio-media');
