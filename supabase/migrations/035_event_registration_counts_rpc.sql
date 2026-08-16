-- Public approved registration counts (bypasses registrations RLS for aggregate only)

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
    and r.status = 'approved'
  group by r.event_id;
$$;

grant execute on function public.get_event_registration_counts(uuid[]) to authenticated, anon;
