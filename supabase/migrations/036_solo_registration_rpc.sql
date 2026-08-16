-- Solo registration RPC (explicit pending status, same pattern as party apply)

create or replace function public.create_solo_registration(
  p_event_id uuid,
  p_apply_weight_class text,
  p_apply_experience text,
  p_gym_affiliation text default null,
  p_applicant_notes text default null,
  p_seeking_sparring boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_registration_id uuid;
begin
  if v_user is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  if p_apply_weight_class is null or trim(p_apply_weight_class) = '' then
    raise exception 'WEIGHT_CLASS_REQUIRED';
  end if;

  if p_apply_experience is null or trim(p_apply_experience) = '' then
    raise exception 'EXPERIENCE_REQUIRED';
  end if;

  if exists (
    select 1
    from public.registrations r
    where r.event_id = p_event_id
      and r.user_id = v_user
      and r.status in ('pending', 'approved')
  ) then
    raise exception 'ALREADY_REGISTERED';
  end if;

  insert into public.registrations (
    event_id,
    user_id,
    status,
    seeking_sparring_partner,
    sparring_intensity,
    apply_weight_class,
    apply_experience,
    gym_affiliation,
    applicant_notes
  )
  values (
    p_event_id,
    v_user,
    'pending'::public.registration_status,
    coalesce(p_seeking_sparring, false),
    null,
    trim(p_apply_weight_class),
    trim(p_apply_experience),
    nullif(trim(p_gym_affiliation), ''),
    nullif(trim(p_applicant_notes), '')
  )
  returning id into v_registration_id;

  return v_registration_id;
end;
$$;

grant execute on function public.create_solo_registration(
  uuid,
  text,
  text,
  text,
  text,
  boolean
) to authenticated;

notify pgrst, 'reload schema';
