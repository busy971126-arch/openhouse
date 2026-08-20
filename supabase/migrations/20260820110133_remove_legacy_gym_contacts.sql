-- STEP C: remove legacy gyms.representative_* after gym_private_contacts
-- is the source of truth. Do not drop gym_private_contacts or gyms.phone.

do $$
begin
  if exists (
    select 1
    from public.gyms g
    left join public.gym_private_contacts c
      on c.gym_id = g.id
    where c.gym_id is null
  ) then
    raise exception
      'Cannot remove legacy gym contacts: missing private contact rows';
  end if;
end
$$;

drop trigger if exists sync_gym_private_contacts_from_legacy on public.gyms;

drop function if exists public.sync_gym_private_contacts_from_legacy();

alter table public.gyms
  drop column if exists representative_name,
  drop column if exists representative_phone,
  drop column if exists representative_role,
  drop column if exists representative_role_custom;
