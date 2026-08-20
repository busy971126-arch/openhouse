-- Public approved registration count (bypasses registrations RLS for aggregate only)

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
    and status = 'approved';
$$;

grant execute on function public.get_event_registration_count(uuid) to authenticated, anon;
