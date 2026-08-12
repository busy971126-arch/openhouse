-- Gym representative contact (signup operator flow)

alter table public.gyms
  add column if not exists representative_name text,
  add column if not exists representative_phone text;
