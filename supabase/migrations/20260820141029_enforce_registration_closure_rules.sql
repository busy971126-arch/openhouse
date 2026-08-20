-- Enforce registration closure in create_solo_registration and
-- create_party_registration. Does not change capacity, grants, or
-- SECURITY DEFINER. Pending insert remains the only new registration status.

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
set search_path to 'public'
as $$
declare
  v_user uuid := auth.uid();
  v_registration_id uuid;
  v_event_status text;
  v_deadline date;
  v_closed boolean;
begin
  if v_user is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  select e.status, e.registration_deadline, e.recruitment_closed
    into v_event_status, v_deadline, v_closed
  from public.events e
  where e.id = p_event_id;

  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if coalesce(v_event_status, 'active') <> 'active' then
    raise exception 'EVENT_CANCELLED';
  end if;

  if v_closed then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  if v_deadline is not null and v_deadline < current_date then
    raise exception 'REGISTRATION_CLOSED';
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

create or replace function public.create_party_registration(
  p_event_id uuid,
  p_apply_weight_class text,
  p_apply_experience text,
  p_gym_affiliation text default null,
  p_applicant_notes text default null,
  p_seeking_sparring boolean default false,
  p_companion_user_ids uuid[] default array[]::uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user uuid := auth.uid();
  v_party_id uuid := gen_random_uuid();
  v_leader_id uuid;
  v_companion_id uuid;
  v_profile record;
  v_unique_companions uuid[] := array[]::uuid[];
  v_event_status text;
  v_deadline date;
  v_closed boolean;
begin
  if v_user is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  select e.status, e.registration_deadline, e.recruitment_closed
    into v_event_status, v_deadline, v_closed
  from public.events e
  where e.id = p_event_id;

  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if coalesce(v_event_status, 'active') <> 'active' then
    raise exception 'EVENT_CANCELLED';
  end if;

  if v_closed then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  if v_deadline is not null and v_deadline < current_date then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  if p_apply_weight_class is null or trim(p_apply_weight_class) = '' then
    raise exception 'WEIGHT_CLASS_REQUIRED';
  end if;

  if p_apply_experience is null or trim(p_apply_experience) = '' then
    raise exception 'EXPERIENCE_REQUIRED';
  end if;

  if coalesce(array_length(p_companion_user_ids, 1), 0) = 0 then
    raise exception 'COMPANIONS_REQUIRED';
  end if;

  if coalesce(array_length(p_companion_user_ids, 1), 0) > 5 then
    raise exception 'TOO_MANY_COMPANIONS';
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

  select coalesce(array_agg(distinct companion_id), array[]::uuid[])
  into v_unique_companions
  from unnest(coalesce(p_companion_user_ids, array[]::uuid[])) as companion_id
  where companion_id is not null
    and companion_id <> v_user;

  if coalesce(array_length(v_unique_companions, 1), 0) = 0 then
    raise exception 'COMPANIONS_REQUIRED';
  end if;

  foreach v_companion_id in array v_unique_companions
  loop
    if not exists (
      select 1
      from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = v_user and f.addressee_id = v_companion_id)
          or (f.addressee_id = v_user and f.requester_id = v_companion_id)
        )
    ) then
      raise exception 'NOT_FRIENDS';
    end if;

    if exists (
      select 1
      from public.registrations r
      where r.event_id = p_event_id
        and r.user_id = v_companion_id
        and r.status in ('pending', 'approved')
    ) then
      raise exception 'COMPANION_ALREADY_REGISTERED';
    end if;
  end loop;

  insert into public.registrations (
    event_id,
    user_id,
    status,
    seeking_sparring_partner,
    sparring_intensity,
    apply_weight_class,
    apply_experience,
    gym_affiliation,
    applicant_notes,
    party_id,
    party_representative_user_id
  )
  values (
    p_event_id,
    v_user,
    'pending',
    p_seeking_sparring,
    null,
    trim(p_apply_weight_class),
    trim(p_apply_experience),
    nullif(trim(p_gym_affiliation), ''),
    nullif(trim(p_applicant_notes), ''),
    v_party_id,
    v_user
  )
  returning id into v_leader_id;

  foreach v_companion_id in array v_unique_companions
  loop
    select p.weight_class, p.experience
    into v_profile
    from public.profiles p
    where p.id = v_companion_id;

    insert into public.registrations (
      event_id,
      user_id,
      status,
      seeking_sparring_partner,
      sparring_intensity,
      apply_weight_class,
      apply_experience,
      gym_affiliation,
      applicant_notes,
      party_id,
      party_representative_user_id
    )
    values (
      p_event_id,
      v_companion_id,
      'pending',
      false,
      null,
      nullif(trim(v_profile.weight_class), ''),
      nullif(trim(v_profile.experience), ''),
      null,
      null,
      v_party_id,
      v_user
    );
  end loop;

  return jsonb_build_object(
    'party_id', v_party_id,
    'leader_registration_id', v_leader_id,
    'companion_count', coalesce(array_length(v_unique_companions, 1), 0)
  );
end;
$$;

revoke all on function public.create_solo_registration(uuid, text, text, text, text, boolean) from public;
revoke all on function public.create_solo_registration(uuid, text, text, text, text, boolean) from anon;
grant execute on function public.create_solo_registration(uuid, text, text, text, text, boolean) to authenticated;
grant execute on function public.create_solo_registration(uuid, text, text, text, text, boolean) to service_role;

revoke all on function public.create_party_registration(uuid, text, text, text, text, boolean, uuid[]) from public;
revoke all on function public.create_party_registration(uuid, text, text, text, text, boolean, uuid[]) from anon;
grant execute on function public.create_party_registration(uuid, text, text, text, text, boolean, uuid[]) to authenticated;
grant execute on function public.create_party_registration(uuid, text, text, text, text, boolean, uuid[]) to service_role;
