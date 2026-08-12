-- Gym profile enrichment: visit guide, training styles, tags, preparation

alter table public.gyms
  add column if not exists first_visit_welcome boolean,
  add column if not exists walk_in_visits boolean,
  add column if not exists gi_rental text,
  add column if not exists visit_details text,
  add column if not exists preparation_guide text,
  add column if not exists training_styles text[] not null default '{}',
  add column if not exists gym_tags text[] not null default '{}';
