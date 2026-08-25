-- Seed current portfolio metadata (Phase 2).
-- Media paths still reference public/ placeholders until later phases.
-- Idempotent: truncate then insert.
truncate table public.project_images, public.project_videos, public.projects restart identity cascade;

-- montreal-editorial
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Montreal Editorial',
    'montreal-editorial',
    'An editorial study of movement, texture and urban space.',
    'photo',
    '/media/shoes1.jpeg',
    'Editorial portrait photographed in Montreal',
    1600,
    2200,
    true,
    true,
    0
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Editorial frame one',
    1600,
    2200,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Editorial frame two',
    1800,
    1200,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Editorial frame three',
    1400,
    1400,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Editorial frame four',
    1080,
    1920,
    3
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Editorial frame five',
    2400,
    1000,
    4
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Editorial frame six',
    2000,
    1500,
    5
  );
end $$;

-- night-motion
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Night Motion',
    'night-motion',
    'Long-exposure city motion study after dark.',
    'video',
    '/media/shoes1.jpeg',
    'Night street scene with motion blur',
    1920,
    1080,
    true,
    true,
    1
  ) returning id into pid;

  insert into public.project_videos (
    project_id, source_path, status, title, display_order
  ) values (
    pid,
    '/media/videos/CardinTest2.mp4',
    'ready',
    'Night motion film',
    0
  );
end $$;

-- studio-texture
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Studio Texture',
    'studio-texture',
    'Close studies of fabric, light and material.',
    'photo',
    '/media/shoes1.jpeg',
    'Studio still life with textured fabric',
    1400,
    1400,
    true,
    true,
    2
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Studio texture one',
    1400,
    1400,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Studio texture two',
    1600,
    2000,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Studio texture three',
    1800,
    1200,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Studio texture four',
    1600,
    2200,
    3
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Studio texture five',
    1920,
    1080,
    4
  );
end $$;

-- coastal-light
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Coastal Light',
    'coastal-light',
    'Soft coastal light across water and sand.',
    'photo',
    '/media/shoes1.jpeg',
    'Coastal landscape under soft daylight',
    1800,
    1200,
    true,
    true,
    3
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Coastal light one',
    1800,
    1200,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Coastal light two',
    2400,
    1000,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Coastal light three',
    1080,
    1920,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Coastal light four',
    1400,
    1400,
    3
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Coastal light five',
    2000,
    1500,
    4
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Coastal light six',
    1600,
    2000,
    5
  );
end $$;

-- frame-rate
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Frame Rate',
    'frame-rate',
    'Rhythm and pacing in short-form motion.',
    'video',
    '/media/shoes1.jpeg',
    'Still frame from a short motion piece',
    1080,
    1920,
    true,
    true,
    4
  ) returning id into pid;

  insert into public.project_videos (
    project_id, source_path, status, title, display_order
  ) values (
    pid,
    '/media/videos/CardinTest2.mp4',
    'ready',
    'Frame rate film',
    0
  );
end $$;

-- urban-grain
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Urban Grain',
    'urban-grain',
    'Grain and contrast in downtown architecture.',
    'photo',
    '/media/shoes1.jpeg',
    'Urban architecture with strong contrast',
    1600,
    2000,
    true,
    true,
    5
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Urban grain one',
    1600,
    2000,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Urban grain two',
    1920,
    1080,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Urban grain three',
    1600,
    2200,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Urban grain four',
    1400,
    1400,
    3
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Urban grain five',
    2400,
    1000,
    4
  );
end $$;

-- quiet-rooms
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Quiet Rooms',
    'quiet-rooms',
    'Interior stillness and ambient light.',
    'photo',
    '/media/shoes1.jpeg',
    'Quiet interior room with ambient light',
    2000,
    1500,
    true,
    true,
    6
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Quiet rooms one',
    2000,
    1500,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Quiet rooms two',
    1080,
    1920,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Quiet rooms three',
    1400,
    1400,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Quiet rooms four',
    1800,
    1200,
    3
  );
end $$;

-- field-notes
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Field Notes',
    'field-notes',
    'Documentary fragments from travel days.',
    'photo',
    '/media/shoes1.jpeg',
    'Documentary travel photograph',
    2400,
    1000,
    true,
    true,
    7
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Field notes one',
    2400,
    1000,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Field notes two',
    1600,
    2200,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Field notes three',
    1800,
    1200,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Field notes four',
    1400,
    1400,
    3
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Field notes five',
    1600,
    2000,
    4
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Field notes six',
    1920,
    1080,
    5
  );
end $$;

-- red-hour
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Red Hour',
    'red-hour',
    'Warm light and saturated evening tones.',
    'photo',
    '/media/shoes1.jpeg',
    'Scene lit by warm evening light',
    1600,
    2200,
    true,
    true,
    8
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Red hour one',
    1600,
    2200,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Red hour two',
    2000,
    1500,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Red hour three',
    1400,
    1400,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Red hour four',
    1080,
    1920,
    3
  );
end $$;

-- glass-lines
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Glass Lines',
    'glass-lines',
    'Reflections and linear structure in glass.',
    'photo',
    '/media/shoes1.jpeg',
    'Glass facade with linear reflections',
    1920,
    1080,
    true,
    true,
    9
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Glass lines one',
    1920,
    1080,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Glass lines two',
    1600,
    2000,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Glass lines three',
    2400,
    1000,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Glass lines four',
    1400,
    1400,
    3
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Glass lines five',
    1800,
    1200,
    4
  );
end $$;

-- soft-focus
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Soft Focus',
    'soft-focus',
    'Shallow depth and delicate detail.',
    'photo',
    '/media/shoes1.jpeg',
    'Soft-focus detail photograph',
    1400,
    1400,
    true,
    true,
    10
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Soft focus one',
    1400,
    1400,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Soft focus two',
    1600,
    2200,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Soft focus three',
    1800,
    1200,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Soft focus four',
    1080,
    1920,
    3
  );
end $$;

-- cutaway
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Cutaway',
    'cutaway',
    'Editorial cutaways for narrative pace.',
    'video',
    '/media/shoes1.jpeg',
    'Editorial cutaway still from video',
    1080,
    1920,
    true,
    true,
    11
  ) returning id into pid;

  insert into public.project_videos (
    project_id, source_path, status, title, display_order
  ) values (
    pid,
    '/media/videos/CardinTest2.mp4',
    'ready',
    'Cutaway film',
    0
  );
end $$;

-- open-road
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Open Road',
    'open-road',
    'Wide frames along empty highways.',
    'photo',
    '/media/shoes1.jpeg',
    'Open road landscape photograph',
    1800,
    1200,
    true,
    true,
    12
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Open road one',
    1800,
    1200,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Open road two',
    2400,
    1000,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Open road three',
    1600,
    2000,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Open road four',
    1400,
    1400,
    3
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Open road five',
    1920,
    1080,
    4
  );
end $$;

-- after-image
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'After Image',
    'after-image',
    'Residual light and afterimage studies.',
    'photo',
    '/media/shoes1.jpeg',
    'Abstract light study photograph',
    2000,
    1500,
    true,
    true,
    13
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'After image one',
    2000,
    1500,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'After image two',
    1600,
    2200,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'After image three',
    1400,
    1400,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'After image four',
    2400,
    1000,
    3
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'After image five',
    1080,
    1920,
    4
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'After image six',
    1800,
    1200,
    5
  );
end $$;

-- steel-horizon
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Steel Horizon',
    'steel-horizon',
    'Industrial skylines at blue hour.',
    'photo',
    '/media/shoes1.jpeg',
    'Industrial skyline at blue hour',
    1920,
    1080,
    true,
    true,
    14
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Steel horizon one',
    1920,
    1080,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Steel horizon two',
    1600,
    2000,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Steel horizon three',
    1400,
    1400,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Steel horizon four',
    2400,
    1000,
    3
  );
end $$;

-- pulse-line
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Pulse Line',
    'pulse-line',
    'Transit corridors as rhythmic motion studies.',
    'video',
    '/media/shoes1.jpeg',
    'Transit corridor motion study',
    1800,
    1200,
    true,
    true,
    15
  ) returning id into pid;

  insert into public.project_videos (
    project_id, source_path, status, title, display_order
  ) values (
    pid,
    '/media/videos/CardinTest2.mp4',
    'ready',
    'Pulse line film',
    0
  );
end $$;

-- paper-weight
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Paper Weight',
    'paper-weight',
    'Still lifes of paper, ink and shadow.',
    'photo',
    '/media/shoes1.jpeg',
    'Paper still life with shadow',
    1400,
    1400,
    true,
    true,
    16
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Paper weight one',
    1400,
    1400,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Paper weight two',
    1600,
    2200,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Paper weight three',
    2000,
    1500,
    2
  );
end $$;

-- cold-front
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Cold Front',
    'cold-front',
    'Winter weather across open fields.',
    'photo',
    '/media/shoes1.jpeg',
    'Winter field under grey sky',
    2400,
    1000,
    true,
    true,
    17
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Cold front one',
    2400,
    1000,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Cold front two',
    1800,
    1200,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Cold front three',
    1080,
    1920,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Cold front four',
    1400,
    1400,
    3
  );
end $$;

-- signal-loss
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Signal Loss',
    'signal-loss',
    'Interference and dropout as visual language.',
    'video',
    '/media/shoes1.jpeg',
    'Abstract signal interference still',
    1920,
    1080,
    true,
    true,
    18
  ) returning id into pid;

  insert into public.project_videos (
    project_id, source_path, status, title, display_order
  ) values (
    pid,
    '/media/videos/CardinTest2.mp4',
    'ready',
    'Signal loss film',
    0
  );
end $$;

-- drywall
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Drywall',
    'drywall',
    'Construction interiors before finish work.',
    'photo',
    '/media/shoes1.jpeg',
    'Unfinished interior with drywall',
    1600,
    2000,
    true,
    true,
    19
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Drywall one',
    1600,
    2000,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Drywall two',
    2000,
    1500,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Drywall three',
    1400,
    1400,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Drywall four',
    1600,
    2200,
    3
  );
end $$;

-- late-shift
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Late Shift',
    'late-shift',
    'Night workers and empty storefronts.',
    'photo',
    '/media/shoes1.jpeg',
    'Night storefront photograph',
    1800,
    1200,
    true,
    true,
    20
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Late shift one',
    1800,
    1200,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Late shift two',
    1080,
    1920,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Late shift three',
    2400,
    1000,
    2
  );
end $$;

-- amber-hold
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Amber Hold',
    'amber-hold',
    'Warm practical light in small rooms.',
    'photo',
    '/media/shoes1.jpeg',
    'Room lit by amber practical light',
    1600,
    2200,
    true,
    true,
    21
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Amber hold one',
    1600,
    2200,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Amber hold two',
    1400,
    1400,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Amber hold three',
    2000,
    1500,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Amber hold four',
    1600,
    2000,
    3
  );
end $$;

-- runway-dust
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Runway Dust',
    'runway-dust',
    'Airport peripheries and heat haze.',
    'video',
    '/media/shoes1.jpeg',
    'Airport periphery heat haze',
    1920,
    1080,
    true,
    true,
    22
  ) returning id into pid;

  insert into public.project_videos (
    project_id, source_path, status, title, display_order
  ) values (
    pid,
    '/media/videos/CardinTest2.mp4',
    'ready',
    'Runway dust film',
    0
  );
end $$;

-- mirror-pool
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Mirror Pool',
    'mirror-pool',
    'Reflections in shallow urban water.',
    'photo',
    '/media/shoes1.jpeg',
    'Urban water reflection',
    1400,
    1400,
    true,
    true,
    23
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Mirror pool one',
    1400,
    1400,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Mirror pool two',
    1800,
    1200,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Mirror pool three',
    1080,
    1920,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Mirror pool four',
    2400,
    1000,
    3
  );
end $$;

-- northbound
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Northbound',
    'northbound',
    'Highway sequences toward colder latitudes.',
    'photo',
    '/media/shoes1.jpeg',
    'Highway stretching north',
    2000,
    1500,
    true,
    true,
    24
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Northbound one',
    2000,
    1500,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Northbound two',
    1600,
    2000,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Northbound three',
    1920,
    1080,
    2
  );
end $$;

-- static-bloom
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Static Bloom',
    'static-bloom',
    'Floral forms dissolving into grain.',
    'video',
    '/media/shoes1.jpeg',
    'Floral form dissolving into grain',
    1600,
    2200,
    true,
    true,
    25
  ) returning id into pid;

  insert into public.project_videos (
    project_id, source_path, status, title, display_order
  ) values (
    pid,
    '/media/videos/CardinTest2.mp4',
    'ready',
    'Static bloom film',
    0
  );
end $$;

-- flatline
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Flatline',
    'flatline',
    'Horizon studies with minimal contrast.',
    'photo',
    '/media/shoes1.jpeg',
    'Minimal horizon study',
    2400,
    1000,
    true,
    true,
    26
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Flatline one',
    2400,
    1000,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Flatline two',
    1800,
    1200,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Flatline three',
    1400,
    1400,
    2
  );
end $$;

-- cargo-bay
do $$
declare
  pid uuid;
begin
  insert into public.projects (
    title, slug, description, kind,
    cover_image_path, cover_alt_text, cover_width, cover_height,
    is_published, is_featured, display_order
  ) values (
    'Cargo Bay',
    'cargo-bay',
    'Loading docks and packed volumes.',
    'photo',
    '/media/shoes1.jpeg',
    'Loading dock cargo volumes',
    1920,
    1080,
    true,
    true,
    27
  ) returning id into pid;

  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Cargo bay one',
    1920,
    1080,
    0
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Cargo bay two',
    1600,
    2000,
    1
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Cargo bay three',
    1400,
    1400,
    2
  );
  insert into public.project_images (
    project_id, storage_path, alt_text, width, height, display_order
  ) values (
    pid,
    '/media/shoes1.jpeg',
    'Cargo bay four',
    2000,
    1500,
    3
  );
end $$;

