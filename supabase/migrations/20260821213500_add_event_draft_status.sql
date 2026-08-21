alter table public.events drop constraint if exists events_status_check;

alter table public.events
  add constraint events_status_check
  check (status in ('draft', 'active', 'cancelled'));

comment on column public.events.status is
  'Event lifecycle: draft (owner only), active (public), cancelled.';
