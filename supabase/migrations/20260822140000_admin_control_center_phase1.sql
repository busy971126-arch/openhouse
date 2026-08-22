-- Admin Control Center Phase 1.
-- Additive event moderation, operational activity, applications RPCs.
-- Does not restore broad admin SELECT RLS.
-- Does not add event hard delete or registration force actions.
-- Admin event cancel is omitted: it would overwrite host lifecycle and is not reversible.

alter table public.events
  add column if not exists admin_hidden_at timestamptz,
  add column if not exists admin_hidden_by uuid references auth.users (id) on delete set null,
  add column if not exists admin_recruitment_paused_at timestamptz,
  add column if not exists admin_recruitment_paused_by uuid references auth.users (id) on delete set null,
  add column if not exists admin_moderation_reason text;

comment on column public.events.admin_hidden_at is
  'When set, event is hidden from public discovery. Host can still manage.';
comment on column public.events.admin_recruitment_paused_at is
  'When set, new applications are blocked independently of host recruitment_closed.';

alter table public.admin_action_logs
  add column if not exists reason text;

alter table public.admin_action_logs
  drop constraint if exists admin_action_logs_action_check;

alter table public.admin_action_logs
  add constraint admin_action_logs_action_check
  check (action in (
    'inquiry.update',
    'report.update',
    'event.hide',
    'event.restore',
    'event.recruitment_pause',
    'event.recruitment_resume'
  ));

alter table public.admin_action_logs
  drop constraint if exists admin_action_logs_target_type_check;

alter table public.admin_action_logs
  add constraint admin_action_logs_target_type_check
  check (target_type in ('inquiry', 'report', 'event'));

create table if not exists public.operational_activity (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_type text not null,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  event_id uuid,
  constraint operational_activity_actor_type_check
    check (actor_type in ('user', 'host', 'admin', 'system')),
  constraint operational_activity_target_type_check
    check (target_type in ('registration', 'event', 'inquiry', 'report'))
);

comment on table public.operational_activity is
  'Append-only product/admin activity. No message bodies or private contacts.';

create index if not exists idx_operational_activity_occurred
  on public.operational_activity (occurred_at desc);

alter table public.operational_activity enable row level security;

revoke all on table public.operational_activity from public;
revoke all on table public.operational_activity from anon;
grant select on table public.operational_activity to authenticated;
grant all on table public.operational_activity to service_role;

drop policy if exists "Admins can view operational activity" on public.operational_activity;
create policy "Admins can view operational activity"
on public.operational_activity
for select
to authenticated
using (public.is_admin());

-- Public discovery hides admin-hidden events. Creators still see their own rows.
drop policy if exists "Public gym events are viewable; creators can view own events" on public.events;
create policy "Public gym events are viewable; creators can view own events"
on public.events
for select
to public
using (
  created_by = auth.uid()
  or (
    admin_hidden_at is null
    and coalesce(status, 'active') <> 'draft'
    and exists (
      select 1
      from public.gyms g
      where g.id = events.gym_id
        and coalesce(g.is_public, false) = true
    )
  )
);

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
    and new.admin_hidden_by is not distinct from old.admin_hidden_by
    and new.admin_recruitment_paused_at is not distinct from old.admin_recruitment_paused_at
    and new.admin_recruitment_paused_by is not distinct from old.admin_recruitment_paused_by
    and new.admin_moderation_reason is not distinct from old.admin_moderation_reason
  ) then
    return new;
  end if;

  if not public.is_admin() then
    raise exception '운영 상태를 수정할 권한이 없습니다.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_event_admin_moderation_trigger on public.events;
create trigger guard_event_admin_moderation_trigger
before update on public.events
for each row
execute function public.guard_event_admin_moderation();

create or replace function public.log_operational_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.operational_activity (
      actor_type, action, target_type, target_id, event_id
    )
    values (
      'user',
      'registration.created',
      'registration',
      new.id,
      new.event_id
    );
    return new;
  end if;

  if old.status is not distinct from new.status then
    return new;
  end if;

  if new.status = 'approved' then
    insert into public.operational_activity (
      actor_type, action, target_type, target_id, event_id
    )
    values (
      'host',
      'registration.approved',
      'registration',
      new.id,
      new.event_id
    );
  elsif new.status = 'cancelled' then
    insert into public.operational_activity (
      actor_type, action, target_type, target_id, event_id
    )
    values (
      case when coalesce(new.cancelled_by_event, false) then 'system' else 'user' end,
      'registration.cancelled',
      'registration',
      new.id,
      new.event_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists log_operational_registration_trigger on public.registrations;
create trigger log_operational_registration_trigger
after insert or update of status on public.registrations
for each row
execute function public.log_operational_registration();

create or replace function public.log_operational_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.operational_activity (
      actor_type, action, target_type, target_id, event_id
    )
    values (
      'host',
      'event.created',
      'event',
      new.id,
      new.id
    );
    return new;
  end if;

  if coalesce(old.status, 'active') = 'draft'
     and coalesce(new.status, 'active') = 'active' then
    insert into public.operational_activity (
      actor_type, action, target_type, target_id, event_id
    )
    values (
      'host',
      'event.published',
      'event',
      new.id,
      new.id
    );
  end if;

  if coalesce(old.status, 'active') is distinct from 'cancelled'
     and coalesce(new.status, 'active') = 'cancelled' then
    insert into public.operational_activity (
      actor_type, action, target_type, target_id, event_id
    )
    values (
      'host',
      'event.cancelled',
      'event',
      new.id,
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists log_operational_event_trigger on public.events;
create trigger log_operational_event_trigger
after insert or update of status on public.events
for each row
execute function public.log_operational_event();

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
  v_admin_paused timestamptz;
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
    e.admin_recruitment_paused_at,
    e.registration_deadline,
    e.event_date,
    e.event_time
  into
    cap,
    v_event_status,
    v_recruitment_closed,
    v_admin_paused,
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

  if coalesce(v_recruitment_closed, false) or v_admin_paused is not null then
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

create or replace function public.create_solo_registration(
  p_event_id uuid,
  p_apply_weight_class text,
  p_apply_experience text,
  p_gym_affiliation text default null,
  p_applicant_notes text default null,
  p_seeking_sparring boolean default false
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user uuid := auth.uid();
  v_registration_id uuid;
  v_event_status text;
  v_deadline date;
  v_closed boolean;
  v_admin_paused timestamptz;
begin
  if v_user is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  select e.status, e.registration_deadline, e.recruitment_closed, e.admin_recruitment_paused_at
    into v_event_status, v_deadline, v_closed, v_admin_paused
  from public.events e
  where e.id = p_event_id;

  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if coalesce(v_event_status, 'active') <> 'active' then
    raise exception 'EVENT_CANCELLED';
  end if;

  if v_closed or v_admin_paused is not null then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  if v_deadline is not null and v_deadline < current_date then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  if p_apply_weight_class is null or trim(p_apply_weight_class) = '' then
    raise exception 'WEIGHT_CLASS_REQUIRED';
  end if;

  if p_apply_experience is null or trim(p_apply_experience) = '' then
    raise exception 'EXPERIENCE_REQUIRED';
  end if;

  if exists (
    select 1
    from public.registrations r
    where r.event_id = p_event_id
      and r.user_id = v_user
      and r.status in ('pending', 'approved')
  ) then
    raise exception 'ALREADY_REGISTERED';
  end if;

  insert into public.registrations (
    event_id,
    user_id,
    status,
    seeking_sparring_partner,
    sparring_intensity,
    apply_weight_class,
    apply_experience,
    gym_affiliation,
    applicant_notes
  )
  values (
    p_event_id,
    v_user,
    'pending'::public.registration_status,
    coalesce(p_seeking_sparring, false),
    null,
    trim(p_apply_weight_class),
    trim(p_apply_experience),
    nullif(trim(p_gym_affiliation), ''),
    nullif(trim(p_applicant_notes), '')
  )
  returning id into v_registration_id;

  return v_registration_id;
end;
$$;

create or replace function public.create_party_registration(
  p_event_id uuid,
  p_apply_weight_class text,
  p_apply_experience text,
  p_gym_affiliation text default null,
  p_applicant_notes text default null,
  p_seeking_sparring boolean default false,
  p_companion_user_ids uuid[] default array[]::uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user uuid := auth.uid();
  v_party_id uuid := gen_random_uuid();
  v_leader_id uuid;
  v_companion_id uuid;
  v_profile record;
  v_unique_companions uuid[] := array[]::uuid[];
  v_event_status text;
  v_deadline date;
  v_closed boolean;
  v_admin_paused timestamptz;
begin
  if v_user is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  select e.status, e.registration_deadline, e.recruitment_closed, e.admin_recruitment_paused_at
    into v_event_status, v_deadline, v_closed, v_admin_paused
  from public.events e
  where e.id = p_event_id;

  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if coalesce(v_event_status, 'active') <> 'active' then
    raise exception 'EVENT_CANCELLED';
  end if;

  if v_closed or v_admin_paused is not null then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  if v_deadline is not null and v_deadline < current_date then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  if p_apply_weight_class is null or trim(p_apply_weight_class) = '' then
    raise exception 'WEIGHT_CLASS_REQUIRED';
  end if;

  if p_apply_experience is null or trim(p_apply_experience) = '' then
    raise exception 'EXPERIENCE_REQUIRED';
  end if;

  if coalesce(array_length(p_companion_user_ids, 1), 0) = 0 then
    raise exception 'COMPANIONS_REQUIRED';
  end if;

  if coalesce(array_length(p_companion_user_ids, 1), 0) > 5 then
    raise exception 'TOO_MANY_COMPANIONS';
  end if;

  if exists (
    select 1
    from public.registrations r
    where r.event_id = p_event_id
      and r.user_id = v_user
      and r.status in ('pending', 'approved')
  ) then
    raise exception 'ALREADY_REGISTERED';
  end if;

  select coalesce(array_agg(distinct companion_id), array[]::uuid[])
  into v_unique_companions
  from unnest(coalesce(p_companion_user_ids, array[]::uuid[])) as companion_id
  where companion_id is not null
    and companion_id <> v_user;

  if coalesce(array_length(v_unique_companions, 1), 0) = 0 then
    raise exception 'COMPANIONS_REQUIRED';
  end if;

  foreach v_companion_id in array v_unique_companions
  loop
    if not exists (
      select 1
      from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = v_user and f.addressee_id = v_companion_id)
          or (f.addressee_id = v_user and f.requester_id = v_companion_id)
        )
    ) then
      raise exception 'NOT_FRIENDS';
    end if;

    if exists (
      select 1
      from public.registrations r
      where r.event_id = p_event_id
        and r.user_id = v_companion_id
        and r.status in ('pending', 'approved')
    ) then
      raise exception 'COMPANION_ALREADY_REGISTERED';
    end if;
  end loop;

  insert into public.registrations (
    event_id,
    user_id,
    status,
    seeking_sparring_partner,
    sparring_intensity,
    apply_weight_class,
    apply_experience,
    gym_affiliation,
    applicant_notes,
    party_id,
    party_representative_user_id
  )
  values (
    p_event_id,
    v_user,
    'pending',
    p_seeking_sparring,
    null,
    trim(p_apply_weight_class),
    trim(p_apply_experience),
    nullif(trim(p_gym_affiliation), ''),
    nullif(trim(p_applicant_notes), ''),
    v_party_id,
    v_user
  )
  returning id into v_leader_id;

  foreach v_companion_id in array v_unique_companions
  loop
    select p.weight_class, p.experience
    into v_profile
    from public.profiles p
    where p.id = v_companion_id;

    insert into public.registrations (
      event_id,
      user_id,
      status,
      seeking_sparring_partner,
      sparring_intensity,
      apply_weight_class,
      apply_experience,
      gym_affiliation,
      applicant_notes,
      party_id,
      party_representative_user_id
    )
    values (
      p_event_id,
      v_companion_id,
      'pending',
      false,
      null,
      nullif(trim(v_profile.weight_class), ''),
      nullif(trim(v_profile.experience), ''),
      null,
      null,
      v_party_id,
      v_user
    );
  end loop;

  return jsonb_build_object(
    'party_id', v_party_id,
    'leader_registration_id', v_leader_id,
    'companion_count', coalesce(array_length(v_unique_companions, 1), 0)
  );
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
  v_log_action text;
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
    set
      admin_hidden_at = now(),
      admin_hidden_by = auth.uid(),
      admin_moderation_reason = v_reason
    where id = p_event_id;
  elsif v_action = 'event.restore' then
    if v_hidden is null then
      raise exception '숨겨진 이벤트가 아닙니다.';
    end if;
    update public.events
    set
      admin_hidden_at = null,
      admin_hidden_by = null,
      admin_moderation_reason = v_reason
    where id = p_event_id;
  elsif v_action = 'event.recruitment_pause' then
    if v_paused is not null then
      raise exception '이미 신청이 중지된 이벤트입니다.';
    end if;
    update public.events
    set
      admin_recruitment_paused_at = now(),
      admin_recruitment_paused_by = auth.uid(),
      admin_moderation_reason = v_reason
    where id = p_event_id;
  else
    if v_paused is null then
      raise exception '신청이 중지된 이벤트가 아닙니다.';
    end if;
    update public.events
    set
      admin_recruitment_paused_at = null,
      admin_recruitment_paused_by = null,
      admin_moderation_reason = v_reason
    where id = p_event_id;
  end if;

  v_log_action := v_action;

  insert into public.admin_action_logs (
    admin_user_id,
    action,
    target_type,
    target_id,
    reason
  )
  values (
    auth.uid(),
    v_log_action,
    'event',
    p_event_id,
    v_reason
  );

  insert into public.operational_activity (
    actor_type, action, target_type, target_id, event_id
  )
  values (
    'admin',
    v_log_action,
    'event',
    p_event_id,
    p_event_id
  );
end;
$$;

drop function if exists public.admin_get_overview();

create or replace function public.admin_get_overview()
returns table (
  new_users_today bigint,
  applications_today bigint,
  events_published_today bigint,
  active_events_today bigint,
  pending_application_count bigint,
  open_inquiry_count bigint,
  open_report_count bigint,
  draft_event_count bigint,
  events_next_7_days bigint,
  active_application_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date := (timezone('Asia/Seoul', now()))::date;
begin
  if not public.is_admin() then
    raise exception '권한이 없습니다.';
  end if;

  return query
  select
    (
      select count(*)
      from public.profiles p
      where (timezone('Asia/Seoul', p.created_at))::date = v_today
    )::bigint,
    (
      select count(*)
      from public.registrations r
      where (timezone('Asia/Seoul', r.created_at))::date = v_today
    )::bigint,
    (
      select count(*)
      from public.operational_activity a
      where a.action = 'event.published'
        and (timezone('Asia/Seoul', a.occurred_at))::date = v_today
    )::bigint,
    (
      select count(*)
      from public.events e
      where e.status = 'active'
        and e.event_date = v_today
        and e.admin_hidden_at is null
    )::bigint,
    (
      select count(*)
      from public.registrations r
      where r.status = 'pending'::public.registration_status
    )::bigint,
    (select count(*) from public.inquiries i where i.status = 'open')::bigint,
    (select count(*) from public.reports rp where rp.status <> 'resolved')::bigint,
    (select count(*) from public.events e where e.status = 'draft')::bigint,
    (
      select count(*)
      from public.events e
      where e.status = 'active'
        and e.admin_hidden_at is null
        and e.event_date > v_today
        and e.event_date <= (v_today + 7)
    )::bigint,
    (
      select count(*)
      from public.registrations r
      where r.status in (
        'pending'::public.registration_status,
        'approved'::public.registration_status
      )
    )::bigint;
end;
$$;

drop function if exists public.admin_get_events(text, text);

create or replace function public.admin_get_events(
  search text default '',
  p_status text default null
)
returns table (
  id uuid,
  title text,
  event_date date,
  status text,
  gym_name text,
  host_label text,
  application_count bigint,
  is_hidden boolean,
  is_paused boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_search text := trim(both from coalesce(search, ''));
  v_status text := nullif(trim(both from coalesce(p_status, '')), '');
begin
  if not public.is_admin() then
    raise exception '권한이 없습니다.';
  end if;

  if v_status is not null and v_status not in ('draft', 'active', 'cancelled') then
    raise exception '올바른 상태가 아닙니다.';
  end if;

  v_search := replace(replace(v_search, '%', ''), '_', '');

  return query
  select
    e.id,
    e.title,
    e.event_date,
    e.status,
    coalesce(g.name, '체육관') as gym_name,
    coalesce(
      nullif(trim(both from coalesce(p.nickname, '')), ''),
      nullif(trim(both from coalesce(p.display_name, '')), ''),
      '이름 없음'
    ) as host_label,
    (
      select count(*)::bigint
      from public.registrations r
      where r.event_id = e.id
        and r.status in (
          'pending'::public.registration_status,
          'approved'::public.registration_status
        )
    ) as application_count,
    (e.admin_hidden_at is not null) as is_hidden,
    (e.admin_recruitment_paused_at is not null) as is_paused
  from public.events e
  left join public.gyms g on g.id = e.gym_id
  left join public.profiles p on p.id = e.created_by
  where (v_status is null or e.status = v_status)
    and (
      v_search = ''
      or e.title ilike '%' || v_search || '%'
    )
  order by e.event_date desc
  limit 100;
end;
$$;

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
  admin_moderation_reason text
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
    e.admin_moderation_reason
  from public.events e
  left join public.gyms g on g.id = e.gym_id
  left join public.profiles p on p.id = e.created_by
  where e.id = event_id;
end;
$$;

create or replace function public.admin_get_applications(
  search text default '',
  p_status text default null
)
returns table (
  id uuid,
  created_at timestamptz,
  status text,
  participant_label text,
  event_id uuid,
  event_title text,
  event_date date,
  gym_name text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_search text := trim(both from coalesce(search, ''));
  v_status text := nullif(trim(both from coalesce(p_status, '')), '');
begin
  if not public.is_admin() then
    raise exception '권한이 없습니다.';
  end if;

  if v_status is not null
     and v_status not in ('pending', 'approved', 'rejected', 'cancelled') then
    raise exception '올바른 상태가 아닙니다.';
  end if;

  v_search := replace(replace(v_search, '%', ''), '_', '');

  return query
  select
    r.id,
    r.created_at,
    r.status::text,
    coalesce(
      nullif(trim(both from coalesce(p.nickname, '')), ''),
      nullif(trim(both from coalesce(p.display_name, '')), ''),
      '이름 없음'
    ) as participant_label,
    e.id as event_id,
    coalesce(e.title, '이벤트') as event_title,
    e.event_date,
    coalesce(g.name, '체육관') as gym_name
  from public.registrations r
  left join public.profiles p on p.id = r.user_id
  left join public.events e on e.id = r.event_id
  left join public.gyms g on g.id = e.gym_id
  where (v_status is null or r.status = v_status::public.registration_status)
    and (
      v_search = ''
      or coalesce(p.nickname, '') ilike '%' || v_search || '%'
      or coalesce(p.display_name, '') ilike '%' || v_search || '%'
      or coalesce(e.title, '') ilike '%' || v_search || '%'
    )
  order by r.created_at desc
  limit 100;
end;
$$;

create or replace function public.admin_get_application_detail(application_id uuid)
returns table (
  id uuid,
  created_at timestamptz,
  status text,
  participant_id uuid,
  participant_label text,
  event_id uuid,
  event_title text,
  event_date date,
  gym_id uuid,
  gym_name text,
  host_label text
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

  if application_id is null then
    return;
  end if;

  return query
  select
    r.id,
    r.created_at,
    r.status::text,
    r.user_id as participant_id,
    coalesce(
      nullif(trim(both from coalesce(p.nickname, '')), ''),
      nullif(trim(both from coalesce(p.display_name, '')), ''),
      '이름 없음'
    ) as participant_label,
    e.id as event_id,
    coalesce(e.title, '이벤트') as event_title,
    e.event_date,
    g.id as gym_id,
    coalesce(g.name, '체육관') as gym_name,
    coalesce(
      nullif(trim(both from coalesce(h.nickname, '')), ''),
      nullif(trim(both from coalesce(h.display_name, '')), ''),
      '이름 없음'
    ) as host_label
  from public.registrations r
  left join public.profiles p on p.id = r.user_id
  left join public.events e on e.id = r.event_id
  left join public.gyms g on g.id = e.gym_id
  left join public.profiles h on h.id = e.created_by
  where r.id = application_id;
end;
$$;

create or replace function public.admin_get_activity(p_limit integer default 20)
returns table (
  id uuid,
  occurred_at timestamptz,
  actor_type text,
  action text,
  target_type text,
  target_id uuid,
  event_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 50));
begin
  if not public.is_admin() then
    raise exception '권한이 없습니다.';
  end if;

  return query
  select
    a.id,
    a.occurred_at,
    a.actor_type,
    a.action,
    a.target_type,
    a.target_id,
    a.event_id
  from public.operational_activity a
  order by a.occurred_at desc
  limit v_limit;
end;
$$;

revoke all on function public.admin_moderate_event(uuid, text, text) from public;
revoke all on function public.admin_moderate_event(uuid, text, text) from anon;
grant execute on function public.admin_moderate_event(uuid, text, text) to authenticated;
grant execute on function public.admin_moderate_event(uuid, text, text) to service_role;

revoke all on function public.admin_get_overview() from public;
revoke all on function public.admin_get_overview() from anon;
grant execute on function public.admin_get_overview() to authenticated;
grant execute on function public.admin_get_overview() to service_role;

revoke all on function public.admin_get_events(text, text) from public;
revoke all on function public.admin_get_events(text, text) from anon;
grant execute on function public.admin_get_events(text, text) to authenticated;
grant execute on function public.admin_get_events(text, text) to service_role;

revoke all on function public.admin_get_event_detail(uuid) from public;
revoke all on function public.admin_get_event_detail(uuid) from anon;
grant execute on function public.admin_get_event_detail(uuid) to authenticated;
grant execute on function public.admin_get_event_detail(uuid) to service_role;

revoke all on function public.admin_get_applications(text, text) from public;
revoke all on function public.admin_get_applications(text, text) from anon;
grant execute on function public.admin_get_applications(text, text) to authenticated;
grant execute on function public.admin_get_applications(text, text) to service_role;

revoke all on function public.admin_get_application_detail(uuid) from public;
revoke all on function public.admin_get_application_detail(uuid) from anon;
grant execute on function public.admin_get_application_detail(uuid) to authenticated;
grant execute on function public.admin_get_application_detail(uuid) to service_role;

revoke all on function public.admin_get_activity(integer) from public;
revoke all on function public.admin_get_activity(integer) from anon;
grant execute on function public.admin_get_activity(integer) to authenticated;
grant execute on function public.admin_get_activity(integer) to service_role;

create or replace function public.log_admin_inquiry_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if not public.is_admin() then
    return new;
  end if;

  if old.status is not distinct from new.status
     and old.admin_reply is not distinct from new.admin_reply then
    return new;
  end if;

  insert into public.admin_action_logs (
    admin_user_id,
    action,
    target_type,
    target_id
  )
  values (
    auth.uid(),
    'inquiry.update',
    'inquiry',
    new.id
  );

  insert into public.operational_activity (
    actor_type, action, target_type, target_id
  )
  values (
    'admin',
    'inquiry.update',
    'inquiry',
    new.id
  );

  return new;
end;
$$;

create or replace function public.log_admin_report_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if not public.is_admin() then
    return new;
  end if;

  if old.status is not distinct from new.status
     and old.admin_note is not distinct from new.admin_note
     and old.resolved_at is not distinct from new.resolved_at then
    return new;
  end if;

  insert into public.admin_action_logs (
    admin_user_id,
    action,
    target_type,
    target_id
  )
  values (
    auth.uid(),
    'report.update',
    'report',
    new.id
  );

  insert into public.operational_activity (
    actor_type, action, target_type, target_id
  )
  values (
    'admin',
    'report.update',
    'report',
    new.id
  );

  return new;
end;
$$;

comment on function public.admin_get_overview() is
  'KST operations overview. is_admin() required.';

comment on function public.admin_moderate_event(uuid, text, text) is
  'Reversible admin hide/pause transitions. is_admin() required.';
