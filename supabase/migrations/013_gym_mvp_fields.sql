-- Gym registration MVP: sport, contact, facilities

alter table public.gyms
  add column if not exists sport text not null default '유도',
  add column if not exists phone text,
  add column if not exists instagram_url text,
  add column if not exists homepage_url text,
  add column if not exists closed_days text,
  add column if not exists facilities text[] not null default '{}';

-- Backfill instagram from legacy sns_url
update public.gyms
set instagram_url = sns_url
where instagram_url is null
  and sns_url is not null
  and sns_url <> '';
