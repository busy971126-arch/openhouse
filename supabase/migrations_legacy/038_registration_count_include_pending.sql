-- Public registration counts: include pending + approved (신청 즉시 인원 반영)

create or replace function public.get_event_registration_count(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.registrations
  where event_id = p_event_id
    and status in ('pending', 'approved');
$$;

create or replace function public.get_event_registration_counts(p_event_ids uuid[])
returns table(event_id uuid, approved_count integer)
language sql
stable
security definer
set search_path = public
as $$
  select r.event_id, count(*)::integer as approved_count
  from public.registrations r
  where r.event_id = any(p_event_ids)
    and r.status in ('pending', 'approved')
  group by r.event_id;
$$;

grant execute on function public.get_event_registration_count(uuid) to authenticated, anon;
grant execute on function public.get_event_registration_counts(uuid[]) to authenticated, anon;

notify pgrst, 'reload schema';
