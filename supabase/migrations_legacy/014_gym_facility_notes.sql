-- Gym facility free-text notes

alter table public.gyms
  add column if not exists facility_notes text;
