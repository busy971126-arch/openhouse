-- Allow event owners to cancel registrations via update_registration_status
-- (Fix for DBs that already applied 031_erd_mvp_completion.sql)

create or replace function public.update_registration_status(
  p_registration_id uuid,
  p_status public.registration_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_registration public.registrations%rowtype;
begin
  if v_user is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  select *
  into v_registration
  from public.registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'REGISTRATION_NOT_FOUND';
  end if;

  if p_status in ('approved', 'rejected') then
    if not public.is_event_owner(v_registration.event_id) then
      raise exception 'NOT_EVENT_OWNER';
    end if;

    if v_registration.status <> 'pending' then
      raise exception 'INVALID_STATUS_TRANSITION';
    end if;
  elsif p_status = 'cancelled' then
    -- Allow: registrant, party representative, or gym owner of the event
    -- (is_event_owner = caller owns the gym that hosts this event)
    if not (
      v_registration.user_id = v_user
      or (
        v_registration.party_representative_user_id = v_user
        and v_registration.party_id is not null
      )
      or public.is_event_owner(v_registration.event_id)
    ) then
      raise exception 'NOT_ALLOWED';
    end if;
  elsif p_status = 'pending' then
    if not public.is_event_owner(v_registration.event_id) then
      raise exception 'NOT_EVENT_OWNER';
    end if;
  else
    raise exception 'INVALID_STATUS';
  end if;

  update public.registrations
  set status = p_status
  where id = p_registration_id;
end;
$$;
