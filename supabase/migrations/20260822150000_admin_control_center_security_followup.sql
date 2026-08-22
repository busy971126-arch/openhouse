-- Admin Control Center security follow-up.
-- Do not expose admin actor UUID or moderation reason on public event rows.
-- Closed Beta: revoke authenticated execute on create_party_registration.
-- Does not modify 20260822140000.

create or replace function public.guard_event_admin_moderation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if (
    new.admin_hidden_at is not distinct from old.admin_hidden_at
    and new.admin_recruitment_paused_at is not distinct from old.admin_recruitment_paused_at
  ) then
    return new;
  end if;

  if not public.is_admin() then
    raise exception '운영 상태를 수정할 권한이 없습니다.';
  end if;

  return new;
end;
$$;

create or replace function public.admin_moderate_event(
  p_event_id uuid,
  p_action text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text := trim(both from coalesce(p_reason, ''));
  v_action text := trim(both from coalesce(p_action, ''));
  v_hidden timestamptz;
  v_paused timestamptz;
begin
  if not public.is_admin() then
    raise exception '권한이 없습니다.';
  end if;

  if v_action not in (
    'event.hide',
    'event.restore',
    'event.recruitment_pause',
    'event.recruitment_resume'
  ) then
    raise exception '올바른 작업이 아닙니다.';
  end if;

  if char_length(v_reason) = 0 then
    raise exception '사유를 입력해주세요.';
  end if;

  if char_length(v_reason) > 500 then
    raise exception '사유가 너무 깁니다.';
  end if;

  select e.admin_hidden_at, e.admin_recruitment_paused_at
    into v_hidden, v_paused
  from public.events e
  where e.id = p_event_id
  for update;

  if not found then
    raise exception '이벤트를 찾을 수 없습니다.';
  end if;

  if v_action = 'event.hide' then
    if v_hidden is not null then
      raise exception '이미 숨긴 이벤트입니다.';
    end if;
    update public.events
    set admin_hidden_at = now()
    where id = p_event_id;
  elsif v_action = 'event.restore' then
    if v_hidden is null then
      raise exception '숨겨진 이벤트가 아닙니다.';
    end if;
    update public.events
    set admin_hidden_at = null
    where id = p_event_id;
  elsif v_action = 'event.recruitment_pause' then
    if v_paused is not null then
      raise exception '이미 신청이 중지된 이벤트입니다.';
    end if;
    update public.events
    set admin_recruitment_paused_at = now()
    where id = p_event_id;
  else
    if v_paused is null then
      raise exception '신청이 중지된 이벤트가 아닙니다.';
    end if;
    update public.events
    set admin_recruitment_paused_at = null
    where id = p_event_id;
  end if;

  insert into public.admin_action_logs (
    admin_user_id,
    action,
    target_type,
    target_id,
    reason,
    created_at
  )
  values (
    auth.uid(),
    v_action,
    'event',
    p_event_id,
    v_reason,
    clock_timestamp()
  );

  insert into public.operational_activity (
    actor_type, action, target_type, target_id, event_id
  )
  values (
    'admin',
    v_action,
    'event',
    p_event_id,
    p_event_id
  );
end;
$$;

-- Who/why lives in admin_action_logs, not public event rows.
drop function if exists public.admin_get_event_detail(uuid);

create or replace function public.admin_get_event_detail(event_id uuid)
returns table (
  id uuid,
  title text,
  sport text,
  event_type text,
  event_date date,
  event_time time,
  status text,
  region text,
  address text,
  gym_id uuid,
  gym_name text,
  gym_is_public boolean,
  host_label text,
  max_participants integer,
  active_application_count bigint,
  created_at timestamptz,
  description text,
  is_publicly_viewable boolean,
  admin_hidden_at timestamptz,
  admin_recruitment_paused_at timestamptz,
  last_moderation_reason text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception '권한이 없습니다.';
  end if;

  if event_id is null then
    return;
  end if;

  return query
  select
    e.id,
    e.title,
    e.sport,
    e.event_type,
    e.event_date,
    e.event_time,
    e.status,
    e.region,
    e.address,
    e.gym_id,
    coalesce(g.name, '체육관') as gym_name,
    coalesce(g.is_public, false) as gym_is_public,
    coalesce(
      nullif(trim(both from coalesce(p.nickname, '')), ''),
      nullif(trim(both from coalesce(p.display_name, '')), ''),
      '이름 없음'
    ) as host_label,
    e.max_participants,
    (
      select count(*)::bigint
      from public.registrations r
      where r.event_id = e.id
        and r.status in (
          'pending'::public.registration_status,
          'approved'::public.registration_status
        )
    ) as active_application_count,
    e.created_at,
    e.description,
    (
      e.admin_hidden_at is null
      and coalesce(e.status, 'active') <> 'draft'
      and coalesce(g.is_public, false) = true
    ) as is_publicly_viewable,
    e.admin_hidden_at,
    e.admin_recruitment_paused_at,
    (
      select l.reason
      from public.admin_action_logs l
      where l.target_type = 'event'
        and l.target_id = e.id
        and l.action in (
          'event.hide',
          'event.restore',
          'event.recruitment_pause',
          'event.recruitment_resume'
        )
      order by l.created_at desc, l.id desc
      limit 1
    ) as last_moderation_reason
  from public.events e
  left join public.gyms g on g.id = e.gym_id
  left join public.profiles p on p.id = e.created_by
  where e.id = event_id;
end;
$$;

revoke all on function public.admin_moderate_event(uuid, text, text) from public;
revoke all on function public.admin_moderate_event(uuid, text, text) from anon;
grant execute on function public.admin_moderate_event(uuid, text, text) to authenticated;
grant execute on function public.admin_moderate_event(uuid, text, text) to service_role;

revoke all on function public.admin_get_event_detail(uuid) from public;
revoke all on function public.admin_get_event_detail(uuid) from anon;
grant execute on function public.admin_get_event_detail(uuid) to authenticated;
grant execute on function public.admin_get_event_detail(uuid) to service_role;

alter table public.events
  drop column if exists admin_hidden_by,
  drop column if exists admin_recruitment_paused_by,
  drop column if exists admin_moderation_reason;

comment on column public.events.admin_hidden_at is
  'When set, event is hidden from public discovery. Actor/reason live in admin_action_logs.';
comment on column public.events.admin_recruitment_paused_at is
  'When set, new applications are blocked. Actor/reason live in admin_action_logs.';

revoke all on function public.create_party_registration(uuid, text, text, text, text, boolean, uuid[]) from public;
revoke all on function public.create_party_registration(uuid, text, text, text, text, boolean, uuid[]) from anon;
revoke all on function public.create_party_registration(uuid, text, text, text, text, boolean, uuid[]) from authenticated;
grant execute on function public.create_party_registration(uuid, text, text, text, text, boolean, uuid[]) to service_role;
