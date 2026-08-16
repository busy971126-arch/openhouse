-- Fix infinite recursion in "Party members can view party registrations" policy.
-- The policy subquery on registrations triggered RLS again on the same table.

create or replace function public.user_party_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select distinct party_id
  from public.registrations
  where user_id = auth.uid()
    and party_id is not null;
$$;

drop policy if exists "Party members can view party registrations" on public.registrations;

create policy "Party members can view party registrations"
  on public.registrations for select to authenticated
  using (
    party_id is not null
    and party_id in (select public.user_party_ids())
  );

notify pgrst, 'reload schema';
