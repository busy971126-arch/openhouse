-- Class schedule (수업 시간표) replaces flat operating_hours

alter table public.gyms
  add column if not exists class_schedule jsonb not null default '[]'::jsonb;
