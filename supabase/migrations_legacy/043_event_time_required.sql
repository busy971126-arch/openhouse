-- Require event start time (events.event_time)

update public.events
set event_time = time '10:00:00'
where event_time is null;

alter table public.events
  alter column event_time set not null;

comment on column public.events.event_time is
  'Event start time (required).';

notify pgrst, 'reload schema';
