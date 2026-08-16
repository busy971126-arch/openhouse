-- Fix check_event_capacity: avoid coalesce(enum, '') which casts '' to registration_status

create or replace function public.check_event_capacity()
returns trigger
language plpgsql
as $$
declare
  cap integer;
  approved_count integer;
  becoming_approved boolean;
begin
  becoming_approved := new.status = 'approved'
    and (
      tg_op = 'INSERT'
      or (old.status is not null and old.status is distinct from 'approved')
    );

  if not becoming_approved then
    return new;
  end if;

  select e.max_participants
  into cap
  from public.events e
  where e.id = new.event_id
  for update;

  if cap is null then
    return new;
  end if;

  select count(*)
  into approved_count
  from public.registrations r
  where r.event_id = new.event_id
    and r.status = 'approved'
    and r.id is distinct from coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if approved_count >= cap then
    raise exception 'Event is full (max % participants)', cap;
  end if;

  return new;
end;
$$;

notify pgrst, 'reload schema';
