-- Admin Control Center 1.2.
-- Separate stale pending applications from current pending work and keep
-- active application metrics scoped to current/future active events.

-- Recreate overview with additive pending-work breakdown fields.
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
  active_application_count bigint,
  current_pending_application_count bigint,
  stale_pending_application_count bigint
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
      join public.events e on e.id = r.event_id
      where r.status in (
        'pending'::public.registration_status,
        'approved'::public.registration_status
      )
        and e.status = 'active'
        and e.event_date >= v_today
    )::bigint,
    (
      select count(*)
      from public.registrations r
      join public.events e on e.id = r.event_id
      where r.status = 'pending'::public.registration_status
        and e.event_date >= v_today
    )::bigint,
    (
      select count(*)
      from public.registrations r
      join public.events e on e.id = r.event_id
      where r.status = 'pending'::public.registration_status
        and e.event_date < v_today
    )::bigint;
end;
$$;

revoke all on function public.admin_get_overview() from public;
revoke all on function public.admin_get_overview() from anon;
grant execute on function public.admin_get_overview() to authenticated;
grant execute on function public.admin_get_overview() to service_role;

-- Pending work is operational debt, so oldest pending applications come first.
-- Other application views keep the existing newest-first order.
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
  order by
    case when v_status = 'pending' then r.created_at end asc nulls last,
    r.created_at desc
  limit 100;
end;
$$;

revoke all on function public.admin_get_applications(text, text) from public;
revoke all on function public.admin_get_applications(text, text) from anon;
grant execute on function public.admin_get_applications(text, text) to authenticated;
grant execute on function public.admin_get_applications(text, text) to service_role;
