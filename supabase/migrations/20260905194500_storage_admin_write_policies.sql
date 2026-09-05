-- Storage mutations require explicit CMS admin membership.

drop policy if exists "Authenticated upload portfolio media" on storage.objects;
drop policy if exists "Authenticated update portfolio media" on storage.objects;
drop policy if exists "Authenticated delete portfolio media" on storage.objects;

create policy "Admins can upload portfolio media"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-media'
    and public.is_admin()
  );

create policy "Admins can update portfolio media"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'portfolio-media'
    and public.is_admin()
  )
  with check (
    bucket_id = 'portfolio-media'
    and public.is_admin()
  );

create policy "Admins can delete portfolio media"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'portfolio-media'
    and public.is_admin()
  );
