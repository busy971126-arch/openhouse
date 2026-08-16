-- Optional recurring weekday codes for regular schedules (null = one-off event)

alter table public.events
  add column if not exists recurring_days text[] default null;

comment on column public.events.recurring_days is
  'Optional weekday codes (mon–sun) for recurring schedules. Null or empty for one-off events.';

alter table public.events
  drop constraint if exists events_recurring_days_valid;

alter table public.events
  add constraint events_recurring_days_valid
  check (
    recurring_days is null
    or cardinality(recurring_days) = 0
    or recurring_days <@ array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']::text[]
  );

notify pgrst, 'reload schema';
