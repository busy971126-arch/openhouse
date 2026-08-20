-- Per-event location (address + region on events, not gyms)

alter table public.events
  add column if not exists address text;

comment on column public.events.address is
  'Event venue address. May differ from the linked gym address.';

update public.events e
set address = g.address
from public.gyms g
where g.id = e.gym_id
  and e.address is null
  and g.address is not null
  and trim(g.address) <> '';

notify pgrst, 'reload schema';
