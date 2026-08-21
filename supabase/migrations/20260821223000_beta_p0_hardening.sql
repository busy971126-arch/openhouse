-- Closed Beta P0 hardening.
-- 1) Notify followers only when an event is actually published.
-- 2) Propagate host event cancellation to participant registrations + notifications.
-- 3) Block registrations after an event starts (Asia/Seoul) at the DB boundary.
-- 4) Only the receiver of a friend request can accept/reject it.
-- 5) Enforce profile visibility inside get_public_profile().

alter table public.registrations
  add column if not exists cancelled_by_event boolean not null default false;

create or replace function public.notify_interested_users_on_new_event()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_gym_name text;
  v_is_public boolean;
begin
  -- Drafts and cancelled events must never produce discovery notifications.
  if new.status <> 'active' then
    return new;
  end if;

  -- UPDATE trigger is used for draft -> active publication. Avoid duplicates when
  -- an already-active row receives an unrelated status update.
  if tg_op = 'UPDATE' and old.status = 'active' then
    return new;
  end if;

  select g.name, g.is_public into v_gym_name, v_is_public
  from public.gyms g
  where g.id = new.gym_id;

  if not coalesce(v_is_public, true) then
    return new;
  end if;

  insert into public.notifications (user_id, type, title, body, link)
  select
    gf.user_id,
    'new_event_gym',
    '관심 체육관 새 일정',
    v_gym_name || '에서 새로운 ' || new.sport || ' 일정이 등록되었습니다.',
    '/events/' || new.id
  from public.gym_follows gf
  join public.profiles p on p.id = gf.user_id
  where gf.gym_id = new.gym_id
    and gf.user_id <> new.created_by
    and p.notify_new_events = true;

  insert into public.notifications (user_id, type, title, body, link)
  select distinct
    p.id,
    'new_event_region',
    '새 일정 알림',
    new.region || '에 새로운 ' || new.sport || ' 일정이 등록되었습니다.',
    '/events/' || new.id
  from public.profiles p
  where p.notify_new_events = true
    and p.id <> new.created_by
    and not exists (
      select 1 from public.gym_follows gf
      where gf.user_id = p.id and gf.gym_id = new.gym_id
    )
    and (
      '전국' = any(p.regions)
      or exists (
        select 1 from unnest(coalesce(p.regions, '{}')) as r(region)
        where new.region ilike r.region || '%'
           or new.region ilike '%' || r.region || '%'
      )
    )
    and (
      coalesce(array_length(p.preferred_sports, 1), 0) = 0
      or new.sport = any(p.preferred_sports)
    );

  return new;
end;
$$;

drop trigger if exists events_notify_interested on public.events;
create trigger events_notify_interested
after insert or update of status on public.events
for each row execute function public.notify_interested_users_on_new_event();

create or replace function public.notify_on_registration()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_owner_id uuid;
  v_event_title text;
  v_event_status text;
begin
  select g.owner_id, e.title, e.status
  into v_owner_id, v_event_title, v_event_status
  from public.events e
  join public.gyms g on g.id = e.gym_id
  where e.id = coalesce(new.event_id, old.event_id);

  if tg_op = 'INSERT' and new.status = 'pending' then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      v_owner_id,
      'registration_pending',
      '새 참가 신청',
      v_event_title || ' 일정에 새 신청이 있습니다.',
      '/events/' || new.event_id || '/participants'
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'approved' then
      insert into public.notifications (user_id, type, title, body, link)
      values (
        new.user_id,
        'registration_approved',
        '참가 확정',
        v_event_title || ' 참가가 확정되었습니다.',
        '/my/registrations'
      );
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, type, title, body, link)
      values (
        new.user_id,
        'registration_rejected',
        '참가 미승인',
        v_event_title || ' 참가 신청이 승인되지 않았습니다.',
        '/my/registrations'
      );
    elsif new.status = 'cancelled'
      and old.status in ('pending', 'approved')
      and not coalesce(new.cancelled_by_event, false)
      and coalesce(v_event_status, 'active') <> 'cancelled'
    then
      insert into public.notifications (user_id, type, title, body, link)
      values (
        v_owner_id,
        'registration_cancelled',
        '참가 취소',
        v_event_title || ' 일정 참가가 취소되었습니다.',
        '/events/' || new.event_id || '/participants'
      );
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.handle_event_cancellation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if old.status is distinct from new.status and new.status = 'cancelled' then
    insert into public.notifications (user_id, type, title, body, link)
    select distinct
      r.user_id,
      'event_cancelled',
      '이벤트 취소',
      new.title || ' 일정이 운영자에 의해 취소되었습니다.',
      '/my/registrations?date=' || new.event_date::text
    from public.registrations r
    where r.event_id = new.id
      and r.status in ('pending', 'approved');

    update public.registrations
    set status = 'cancelled',
        cancelled_by_event = true
    where event_id = new.id
      and status in ('pending', 'approved');
  end if;

  return new;
end;
$$;

drop trigger if exists events_propagate_cancellation on public.events;
create trigger events_propagate_cancellation
after update of status on public.events
for each row execute function public.handle_event_cancellation();

create or replace function public.check_event_capacity()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  cap integer;
  occupied_count integer;
  becoming_occupied boolean;
  v_event_status text;
  v_recruitment_closed boolean;
  v_deadline date;
  v_event_date date;
  v_event_time time without time zone;
  v_now timestamp without time zone := timezone('Asia/Seoul', now());
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

  select
    e.max_participants,
    e.status,
    e.recruitment_closed,
    e.registration_deadline,
    e.event_date,
    e.event_time
  into
    cap,
    v_event_status,
    v_recruitment_closed,
    v_deadline,
    v_event_date,
    v_event_time
  from public.events e
  where e.id = new.event_id
  for update;

  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if coalesce(v_event_status, 'active') <> 'active' then
    raise exception 'EVENT_CANCELLED';
  end if;

  if coalesce(v_recruitment_closed, false) then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  if v_deadline is not null and v_deadline < v_now::date then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  if v_event_date < v_now::date
    or (
      v_event_date = v_now::date
      and v_event_time is not null
      and v_event_time <= v_now::time
    )
  then
    raise exception 'EVENT_STARTED';
  end if;

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

-- Friend request transitions: sender can delete/cancel their request, but only
-- the receiver can accept/reject it. Restrict UPDATE privilege to status only.
drop policy if exists "Users can respond to friend requests" on public.friendships;
create policy "Receivers can respond to friend requests"
on public.friendships
for update
to authenticated
using (
  auth.uid() = addressee_id
  and status = 'pending'
)
with check (
  auth.uid() = addressee_id
  and status in ('accepted', 'rejected')
);

revoke update on public.friendships from authenticated;
grant update (status) on public.friendships to authenticated;

create or replace function public.get_public_profile(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  with viewer as (
    select
      auth.uid() as viewer_id,
      auth.uid() = p_user_id as is_self,
      exists (
        select 1
        from public.friendships f
        where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = p_user_id)
            or (f.addressee_id = auth.uid() and f.requester_id = p_user_id)
          )
      ) as is_friend
  )
  select jsonb_build_object(
    'id', p.id,
    'display_name', case when v.is_self or v.is_friend then p.display_name else null end,
    'nickname', p.nickname,
    'gender', case when v.is_self then p.gender else null end,
    'experience', case
      when v.is_self
        or coalesce(p.visibility_settings ->> 'experience', 'public') = 'public'
        or (v.is_friend and coalesce(p.visibility_settings ->> 'experience', 'public') = 'friends')
      then p.experience else null end,
    'weight_class', case
      when v.is_self
        or coalesce(p.visibility_settings ->> 'weight_class', 'public') = 'public'
        or (v.is_friend and coalesce(p.visibility_settings ->> 'weight_class', 'public') = 'friends')
      then p.weight_class else null end,
    'regions', case
      when v.is_self
        or coalesce(p.visibility_settings ->> 'regions', 'public') = 'public'
        or (v.is_friend and coalesce(p.visibility_settings ->> 'regions', 'public') = 'friends')
      then p.regions else null end,
    'preferred_sports', case
      when v.is_self
        or coalesce(p.visibility_settings ->> 'preferred_sports', 'public') = 'public'
        or (v.is_friend and coalesce(p.visibility_settings ->> 'preferred_sports', 'public') = 'friends')
      then p.preferred_sports else null end,
    'photo_url', p.photo_url,
    'bio', case
      when v.is_self
        or coalesce(p.visibility_settings ->> 'bio', 'public') = 'public'
        or (v.is_friend and coalesce(p.visibility_settings ->> 'bio', 'public') = 'friends')
      then p.bio else null end,
    'created_at', p.created_at,
    'visibility_settings', p.visibility_settings
  )
  from public.profiles p
  cross join viewer v
  where p.id = p_user_id
    and v.viewer_id is not null;
$$;

revoke all on function public.get_public_profile(uuid) from public;
revoke all on function public.get_public_profile(uuid) from anon;
grant execute on function public.get_public_profile(uuid) to authenticated;
grant execute on function public.get_public_profile(uuid) to service_role;
