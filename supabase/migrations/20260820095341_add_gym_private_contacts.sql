-- Additive split: owner-only gym contact data.
-- Does not drop, null, or update public.gyms.representative_* columns.

create table public.gym_private_contacts (
  gym_id uuid primary key
    references public.gyms (id) on delete cascade,
  representative_name text,
  representative_phone text,
  representative_role text,
  representative_role_custom text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.gym_private_contacts is
  'Owner-only gym representative contact. Not readable by anon or non-owners.';

alter table public.gym_private_contacts enable row level security;

revoke all on table public.gym_private_contacts from public;
revoke all on table public.gym_private_contacts from anon;
revoke all on table public.gym_private_contacts from authenticated;

grant select, insert, update, delete
  on table public.gym_private_contacts
  to authenticated;

grant all
  on table public.gym_private_contacts
  to service_role;

create policy "Gym owners can view private contacts"
  on public.gym_private_contacts
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.gyms
      where public.gyms.id = gym_id
        and public.gyms.owner_id = auth.uid()
    )
  );

create policy "Gym owners can insert private contacts"
  on public.gym_private_contacts
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.gyms
      where public.gyms.id = gym_id
        and public.gyms.owner_id = auth.uid()
    )
  );

create policy "Gym owners can update private contacts"
  on public.gym_private_contacts
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.gyms
      where public.gyms.id = gym_id
        and public.gyms.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.gyms
      where public.gyms.id = gym_id
        and public.gyms.owner_id = auth.uid()
    )
  );

create policy "Gym owners can delete private contacts"
  on public.gym_private_contacts
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.gyms
      where public.gyms.id = gym_id
        and public.gyms.owner_id = auth.uid()
    )
  );

insert into public.gym_private_contacts (
  gym_id,
  representative_name,
  representative_phone,
  representative_role,
  representative_role_custom
)
select
  id,
  representative_name,
  representative_phone,
  representative_role,
  representative_role_custom
from public.gyms
on conflict (gym_id) do nothing;

-- Temporary cutover compatibility until STEP C drops gyms.representative_*.
-- Keeps gym_private_contacts in sync while the old app still writes
-- representative_* onto public.gyms. Remove this trigger in STEP C.
create or replace function public.sync_gym_private_contacts_from_legacy()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- New application does not write representative_* onto gyms.
  -- An INSERT with all-null contact fields does not need a sync row.
  if new.representative_name is null
     and new.representative_phone is null
     and new.representative_role is null
     and new.representative_role_custom is null then
    return new;
  end if;

  insert into public.gym_private_contacts (
    gym_id,
    representative_name,
    representative_phone,
    representative_role,
    representative_role_custom,
    updated_at
  )
  values (
    new.id,
    new.representative_name,
    new.representative_phone,
    new.representative_role,
    new.representative_role_custom,
    now()
  )
  on conflict (gym_id)
  do update set
    representative_name = excluded.representative_name,
    representative_phone = excluded.representative_phone,
    representative_role = excluded.representative_role,
    representative_role_custom = excluded.representative_role_custom,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists sync_gym_private_contacts_from_legacy on public.gyms;

create trigger sync_gym_private_contacts_from_legacy
  after insert or update of
    representative_name,
    representative_phone,
    representative_role,
    representative_role_custom
  on public.gyms
  for each row
  execute function public.sync_gym_private_contacts_from_legacy();
