-- Event visit info: gi rental and entry instructions (moved from gym profile)

alter table public.events
  add column if not exists gi_rental text,
  add column if not exists visit_details text;
