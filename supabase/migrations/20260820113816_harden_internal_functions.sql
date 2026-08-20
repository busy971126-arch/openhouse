-- Harden two functions missing a fixed search_path, and revoke
-- direct RPC execute on trigger-only SECURITY DEFINER helpers.
-- Does not change function business logic.
-- Recreates auth.users.on_auth_user_created so local/staging match Production.

create or replace function public.age_to_age_group(age_val integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when age_val between 10 and 19 then '10대'
    when age_val between 20 and 29 then '20대'
    when age_val between 30 and 39 then '30대'
    when age_val >= 40 then '30+'
    else null
  end;
$$;

create or replace function public.check_event_capacity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  cap integer;
  occupied_count integer;
  becoming_occupied boolean;
begin
  becoming_occupied := new.status in (
      'pending'::public.registration_status,
      'approved'::public.registration_status
    )
    and (
      tg_op = 'INSERT'
      or old.status is null
      or old.status not in (
        'pending'::public.registration_status,
        'approved'::public.registration_status
      )
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
    and r.status in (
      'pending'::public.registration_status,
      'approved'::public.registration_status
    )
    and (tg_op = 'INSERT' or r.id <> new.id);

  if occupied_count >= cap then
    raise exception 'Event is full (max % participants)', cap;
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

revoke all on function public.notify_interested_users_on_new_event() from public;
revoke all on function public.notify_interested_users_on_new_event() from anon;
revoke all on function public.notify_interested_users_on_new_event() from authenticated;

revoke all on function public.notify_on_announcement() from public;
revoke all on function public.notify_on_announcement() from anon;
revoke all on function public.notify_on_announcement() from authenticated;

revoke all on function public.notify_on_registration() from public;
revoke all on function public.notify_on_registration() from anon;
revoke all on function public.notify_on_registration() from authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
