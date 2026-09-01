-- Site-wide and per-project SEO overrides (CMS-managed)

alter table public.site_settings
  add column if not exists home_seo_title text,
  add column if not exists home_seo_description text,
  add column if not exists about_seo_title text,
  add column if not exists about_seo_description text;

alter table public.projects
  add column if not exists seo_title text,
  add column if not exists seo_description text;

update public.site_settings
set
  home_seo_title = coalesce(home_seo_title, 'Caloid'),
  home_seo_description = coalesce(
    home_seo_description,
    'Montreal-based photographer and cinematographer Camilo Luna.'
  ),
  about_seo_title = coalesce(about_seo_title, 'About'),
  about_seo_description = coalesce(
    about_seo_description,
    'Born in Bogotá and based in Montreal, Camilo Luna (CALOID) works across photography and filmmaking.'
  )
where id = 'default';
