-- Closed Beta admin security review.
-- Removes broad admin table SELECT RLS. Directory reads go through RPCs.
-- Preserves inquiry/report admin SELECT/UPDATE.
-- Audit logs survive admin_users deletion.
-- Service-role/owner maintenance updates are not blocked by admin JWT guards.

drop policy if exists "Admins can view all gyms" on public.gyms;
drop policy if exists "Admins can view all events" on public.events;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can view all registrations" on public.registrations;

alter table public.admin_action_logs
  drop constraint if exists admin_action_logs_admin_user_id_fkey;

alter table public.admin_action_logs
  alter column admin_user_id drop not null;

alter table public.admin_action_logs
  add constraint admin_action_logs_admin_user_id_fkey
  foreign key (admin_user_id)
  references auth.users (id)
  on delete set null;

comment on column public.admin_action_logs.admin_user_id is
  'Acting admin at write time. Nullable so removing admin_users does not delete history.';

create or replace function public.guard_inquiry_admin_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- JWT session: admins may only change status/admin_reply.
  -- auth.uid() is null for service_role / table-owner maintenance.
  if auth.uid() is not null then
    if not public.is_admin() then
      raise exception '문의를 수정할 권한이 없습니다.';
    end if;

    if (
      to_jsonb(new) - array['status', 'admin_reply']::text[]
      is distinct from
      to_jsonb(old) - array['status', 'admin_reply']::text[]
    ) then
      raise exception '문의 원본은 수정할 수 없습니다.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.guard_report_admin_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    if not public.is_admin() then
      raise exception '신고를 수정할 권한이 없습니다.';
    end if;

    if (
      to_jsonb(new) - array['status', 'admin_note', 'resolved_at']::text[]
      is distinct from
      to_jsonb(old) - array['status', 'admin_note', 'resolved_at']::text[]
    ) then
      raise exception '신고 원본은 수정할 수 없습니다.';
    end if;
  end if;

  return new;
end;
$$;

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

  return new;
end;
$$;

create or replace function public.admin_get_overview()
returns table (
  user_count bigint,
  gym_count bigint,
  public_event_count bigint,
  draft_event_count bigint,
  active_application_count bigint,
  open_inquiry_count bigint,
  open_report_count bigint
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

  return query
  select
    (select count(*) from public.profiles)::bigint,
    (select count(*) from public.gyms)::bigint,
    (select count(*) from public.events where status = 'active')::bigint,
    (select count(*) from public.events where status = 'draft')::bigint,
    (
      select count(*)
      from public.registrations
      where status in (
        'pending'::public.registration_status,
        'approved'::public.registration_status
      )
    )::bigint,
    (select count(*) from public.inquiries where status = 'open')::bigint,
    (select count(*) from public.reports where status <> 'resolved')::bigint;
end;
$$;

create or replace function public.admin_get_users(search text default '')
returns table (
  id uuid,
  nickname text,
  display_name text,
  created_at timestamptz,
  is_operator boolean,
  application_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_search text := trim(both from coalesce(search, ''));
begin
  if not public.is_admin() then
    raise exception '권한이 없습니다.';
  end if;

  v_search := replace(replace(v_search, '%', ''), '_', '');

  return query
  select
    p.id,
    p.nickname,
    p.display_name,
    p.created_at,
    exists (
      select 1 from public.gyms g where g.owner_id = p.id
    ) as is_operator,
    (
      select count(*)::bigint
      from public.registrations r
      where r.user_id = p.id
    ) as application_count
  from public.profiles p
  where v_search = ''
    or coalesce(p.nickname, '') ilike '%' || v_search || '%'
    or coalesce(p.display_name, '') ilike '%' || v_search || '%'
  order by p.created_at desc
  limit 100;
end;
$$;

create or replace function public.admin_get_gyms(search text default '')
returns table (
  id uuid,
  name text,
  sport text,
  region text,
  is_public boolean,
  created_at timestamptz,
  owner_label text,
  upcoming_event_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_search text := trim(both from coalesce(search, ''));
  v_today date := (timezone('Asia/Seoul', now()))::date;
begin
  if not public.is_admin() then
    raise exception '권한이 없습니다.';
  end if;

  v_search := replace(replace(v_search, '%', ''), '_', '');

  return query
  select
    g.id,
    g.name,
    g.sport,
    g.region,
    g.is_public,
    g.created_at,
    coalesce(
      nullif(trim(both from coalesce(p.nickname, '')), ''),
      nullif(trim(both from coalesce(p.display_name, '')), ''),
      '이름 없음'
    ) as owner_label,
    (
      select count(*)::bigint
      from public.events e
      where e.gym_id = g.id
        and e.status = 'active'
        and e.event_date >= v_today
    ) as upcoming_event_count
  from public.gyms g
  left join public.profiles p on p.id = g.owner_id
  where v_search = ''
    or g.name ilike '%' || v_search || '%'
    or g.region ilike '%' || v_search || '%'
    or g.sport ilike '%' || v_search || '%'
  order by g.created_at desc
  limit 100;
end;
$$;

-- IN param is p_status so it does not clash with RETURNS TABLE(status ...).
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
  application_count bigint
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
    ) as application_count
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

-- Safe labels for inquiry/report screens after broad profile/event SELECT is removed.
create or replace function public.admin_get_profile_labels(user_ids uuid[] default '{}')
returns table (
  id uuid,
  nickname text,
  display_name text
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

  return query
  select p.id, p.nickname, p.display_name
  from public.profiles p
  where p.id = any(coalesce(user_ids, '{}'::uuid[]));
end;
$$;

create or replace function public.admin_get_event_titles(event_ids uuid[] default '{}')
returns table (
  id uuid,
  title text
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

  return query
  select e.id, e.title
  from public.events e
  where e.id = any(coalesce(event_ids, '{}'::uuid[]));
end;
$$;

revoke all on function public.admin_get_overview() from public;
revoke all on function public.admin_get_overview() from anon;
grant execute on function public.admin_get_overview() to authenticated;
grant execute on function public.admin_get_overview() to service_role;

revoke all on function public.admin_get_users(text) from public;
revoke all on function public.admin_get_users(text) from anon;
grant execute on function public.admin_get_users(text) to authenticated;
grant execute on function public.admin_get_users(text) to service_role;

revoke all on function public.admin_get_gyms(text) from public;
revoke all on function public.admin_get_gyms(text) from anon;
grant execute on function public.admin_get_gyms(text) to authenticated;
grant execute on function public.admin_get_gyms(text) to service_role;

revoke all on function public.admin_get_events(text, text) from public;
revoke all on function public.admin_get_events(text, text) from anon;
grant execute on function public.admin_get_events(text, text) to authenticated;
grant execute on function public.admin_get_events(text, text) to service_role;

revoke all on function public.admin_get_profile_labels(uuid[]) from public;
revoke all on function public.admin_get_profile_labels(uuid[]) from anon;
grant execute on function public.admin_get_profile_labels(uuid[]) to authenticated;
grant execute on function public.admin_get_profile_labels(uuid[]) to service_role;

revoke all on function public.admin_get_event_titles(uuid[]) from public;
revoke all on function public.admin_get_event_titles(uuid[]) from anon;
grant execute on function public.admin_get_event_titles(uuid[]) to authenticated;
grant execute on function public.admin_get_event_titles(uuid[]) to service_role;

comment on function public.admin_get_overview() is
  'Admin directory aggregates. is_admin() required. No row payloads.';

comment on function public.admin_get_users(text) is
  'Admin user directory. Nickname/display_name/created_at/operator flag/application count only.';

comment on function public.admin_get_gyms(text) is
  'Admin gym directory. No private contact columns.';

comment on function public.admin_get_events(text, text) is
  'Admin event directory. Filter arg is p_status. No applicant notes.';

comment on function public.admin_get_profile_labels(uuid[]) is
  'Admin nickname labels for inquiry/report screens after profile SELECT RLS was removed.';

comment on function public.admin_get_event_titles(uuid[]) is
  'Admin event titles for report screens after event SELECT RLS was removed.';
