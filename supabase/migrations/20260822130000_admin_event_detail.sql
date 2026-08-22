-- Admin read-only event detail after broad events SELECT RLS was removed.
-- Does not restore admin table SELECT. Does not change public event RLS.

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
  is_publicly_viewable boolean
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
      coalesce(e.status, 'active') <> 'draft'
      and coalesce(g.is_public, false) = true
    ) as is_publicly_viewable
  from public.events e
  left join public.gyms g on g.id = e.gym_id
  left join public.profiles p on p.id = e.created_by
  where e.id = event_id;
end;
$$;

revoke all on function public.admin_get_event_detail(uuid) from public;
revoke all on function public.admin_get_event_detail(uuid) from anon;
grant execute on function public.admin_get_event_detail(uuid) to authenticated;
grant execute on function public.admin_get_event_detail(uuid) to service_role;

comment on function public.admin_get_event_detail(uuid) is
  'Admin read-only event inspection. is_admin() required. No private contact or applicant notes.';
