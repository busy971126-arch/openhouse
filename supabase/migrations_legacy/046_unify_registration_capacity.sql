-- Unify capacity: pending + approved count toward max_participants everywhere.
-- Aligns resolve_new_registration_status (040) and check_event_capacity (037) with
-- public count RPCs (038).

create or replace function public.resolve_new_registration_status(p_event_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_auto boolean;
  v_cap integer;
  v_occupied integer;
begin
  select coalesce(e.auto_approve, false), e.max_participants
  into v_auto, v_cap
  from public.events e
  where e.id = p_event_id;

  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if not v_auto then
    return jsonb_build_object('status', 'pending', 'auto_approved', false);
  end if;

  if v_cap is null then
    return jsonb_build_object('status', 'approved', 'auto_approved', true);
  end if;

  select count(*)
  into v_occupied
  from public.registrations r
  where r.event_id = p_event_id
    and r.status in ('pending', 'approved');

  if v_occupied < v_cap then
    return jsonb_build_object('status', 'approved', 'auto_approved', true);
  end if;

  return jsonb_build_object('status', 'pending', 'auto_approved', false);
end;
$$;

create or replace function public.check_event_capacity()
returns trigger
language plpgsql
as $$
declare
  cap integer;
  occupied_count integer;
  becoming_occupied boolean;
begin
  becoming_occupied := new.status in ('pending', 'approved')
    and (
      tg_op = 'INSERT'
      or old.status is null
      or old.status not in ('pending', 'approved')
    );

  if not becoming_occupied then
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
  into occupied_count
  from public.registrations r
  where r.event_id = new.event_id
    and r.status in ('pending', 'approved')
    and (tg_op = 'INSERT' or r.id <> new.id);

  if occupied_count >= cap then
    raise exception 'Event is full (max % participants)', cap;
  end if;

  return new;
end;
$$;

comment on function public.resolve_new_registration_status(uuid) is
  'Resolves insert status for auto_approve events. Capacity = pending + approved (038).';

notify pgrst, 'reload schema';
