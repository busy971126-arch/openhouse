-- Party (group) registration: representative applies with workout friends

alter table public.registrations
  add column if not exists party_id uuid,
  add column if not exists party_representative_user_id uuid references public.profiles (id);

create index if not exists idx_registrations_party
  on public.registrations (party_id)
  where party_id is not null;

drop policy if exists "Party representative can cancel party" on public.registrations;
create policy "Party representative can cancel party"
  on public.registrations for update to authenticated
  using (
    auth.uid() = user_id
    or (
      party_representative_user_id = auth.uid()
      and party_id is not null
    )
  )
  with check (status = 'cancelled');

drop policy if exists "Party members can view party registrations" on public.registrations;
create policy "Party members can view party registrations"
  on public.registrations for select to authenticated
  using (
    party_id is not null
    and party_id in (
      select r.party_id
      from public.registrations r
      where r.user_id = auth.uid()
        and r.party_id is not null
    )
  );

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

grant execute on function public.create_party_registration(
  uuid,
  text,
  text,
  text,
  text,
  boolean,
  uuid[]
) to authenticated;
