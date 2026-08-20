-- Event auto-approve + registration insert status resolution

alter table public.events
  add column if not exists auto_approve boolean not null default false;

alter table public.registrations
  add column if not exists auto_approved boolean not null default false;

comment on column public.events.auto_approve is
  'When true, new applications are inserted as approved if capacity allows.';
comment on column public.registrations.auto_approved is
  'True when status was approved at insert time via event auto_approve.';

create or replace function public.resolve_new_registration_status(p_event_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_auto boolean;
  v_cap integer;
  v_approved integer;
begin
  select coalesce(e.auto_approve, false), e.max_participants
  into v_auto, v_cap
  from public.events e
  where e.id = p_event_id;

  if not found then
    raise exception 'EVENT_NOT_FOUND';
  end if;

  if not v_auto then
    return jsonb_build_object('status', 'pending', 'auto_approved', false);
  end if;

  if v_cap is null then
    return jsonb_build_object('status', 'approved', 'auto_approved', true);
  end if;

  select count(*)
  into v_approved
  from public.registrations r
  where r.event_id = p_event_id
    and r.status = 'approved';

  if v_approved < v_cap then
    return jsonb_build_object('status', 'approved', 'auto_approved', true);
  end if;

  return jsonb_build_object('status', 'pending', 'auto_approved', false);
end;
$$;

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
  v_resolved jsonb;
  v_status public.registration_status;
  v_auto_approved boolean;
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

  perform 1
  from public.events e
  where e.id = p_event_id
  for update;

  v_resolved := public.resolve_new_registration_status(p_event_id);
  v_status := (v_resolved ->> 'status')::public.registration_status;
  v_auto_approved := coalesce((v_resolved ->> 'auto_approved')::boolean, false);

  insert into public.registrations (
    event_id,
    user_id,
    status,
    auto_approved,
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
    v_status,
    v_auto_approved,
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
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_party_id uuid := gen_random_uuid();
  v_leader_id uuid;
  v_companion_id uuid;
  v_profile record;
  v_unique_companions uuid[] := array[]::uuid[];
  v_resolved jsonb;
  v_status public.registration_status;
  v_auto_approved boolean;
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

  perform 1
  from public.events e
  where e.id = p_event_id
  for update;

  v_resolved := public.resolve_new_registration_status(p_event_id);
  v_status := (v_resolved ->> 'status')::public.registration_status;
  v_auto_approved := coalesce((v_resolved ->> 'auto_approved')::boolean, false);

  insert into public.registrations (
    event_id,
    user_id,
    status,
    auto_approved,
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
    v_status,
    v_auto_approved,
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

    v_resolved := public.resolve_new_registration_status(p_event_id);
    v_status := (v_resolved ->> 'status')::public.registration_status;
    v_auto_approved := coalesce((v_resolved ->> 'auto_approved')::boolean, false);

    insert into public.registrations (
      event_id,
      user_id,
      status,
      auto_approved,
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
      v_status,
      v_auto_approved,
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

grant execute on function public.resolve_new_registration_status(uuid) to authenticated;
grant execute on function public.create_solo_registration(
  uuid,
  text,
  text,
  text,
  text,
  boolean
) to authenticated;
grant execute on function public.create_party_registration(
  uuid,
  text,
  text,
  text,
  text,
  boolean,
  uuid[]
) to authenticated;

notify pgrst, 'reload schema';
