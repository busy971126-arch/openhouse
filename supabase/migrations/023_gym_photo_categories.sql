-- Optional gym photo categories (representative stays in photo_url)

alter table public.gyms
  add column if not exists mat_photos text[] not null default '{}',
  add column if not exists facility_photos text[] not null default '{}',
  add column if not exists exterior_photos text[] not null default '{}',
  add column if not exists parking_photos text[] not null default '{}';
