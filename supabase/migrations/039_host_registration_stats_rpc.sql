-- Host dashboard: registration counts bypassing registrations RLS (owner-scoped)

create or replace function public.get_host_pending_registration_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.registrations r
  join public.events e on e.id = r.event_id
  join public.gyms g on g.id = e.gym_id
  where g.owner_id = auth.uid()
    and r.status = 'pending';
$$;

create or replace function public.get_host_registration_counts_by_event(
  p_event_ids uuid[]
)
returns table(
  event_id uuid,
  pending_count integer,
  approved_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.event_id,
    count(*) filter (where r.status = 'pending')::integer as pending_count,
    count(*) filter (where r.status = 'approved')::integer as approved_count
  from public.registrations r
  join public.events e on e.id = r.event_id
  join public.gyms g on g.id = e.gym_id
  where g.owner_id = auth.uid()
    and r.event_id = any(p_event_ids)
    and r.status in ('pending', 'approved')
  group by r.event_id;
$$;

grant execute on function public.get_host_pending_registration_count() to authenticated;
grant execute on function public.get_host_registration_counts_by_event(uuid[]) to authenticated;

notify pgrst, 'reload schema';
