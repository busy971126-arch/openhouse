-- Interview-driven features: preview, sparring, safety, follows, alerts

-- Profile: weight class + notification preference
alter table public.profiles
  add column if not exists weight_class text,
  add column if not exists notify_new_events boolean not null default true;

-- Copy weight_class from signup metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  age_val integer;
  age_group_val text;
begin
  age_val := nullif(meta ->> 'age', '')::integer;
  age_group_val := coalesce(
    nullif(meta ->> 'age_group', ''),
    public.age_to_age_group(age_val)
  );

  insert into public.profiles (
    id,
    display_name,
    nickname,
    gender,
    age,
    age_group,
    experience,
    weight_class,
    phone,
    parent_phone,
    regions,
    preferred_sports
  )
  values (
    new.id,
    coalesce(meta ->> 'display_name', split_part(new.email, '@', 1)),
    nullif(meta ->> 'nickname', ''),
    meta ->> 'gender',
    age_val,
    age_group_val,
    meta ->> 'experience',
    nullif(meta ->> 'weight_class', ''),
    nullif(meta ->> 'phone', ''),
    nullif(meta ->> 'parent_phone', ''),
    coalesce(
      array(
        select jsonb_array_elements_text(meta -> 'regions')
        where jsonb_typeof(meta -> 'regions') = 'array'
      ),
      '{}'::text[]
    ),
    coalesce(
      array(
        select jsonb_array_elements_text(meta -> 'preferred_sports')
        where jsonb_typeof(meta -> 'preferred_sports') = 'array'
      ),
      '{}'::text[]
    )
  );
  return new;
exception
  when others then
    raise exception 'profile_create_failed: %', SQLERRM;
end;
$$;

-- Registration: sparring partner opt-in
alter table public.registrations
  add column if not exists seeking_sparring_partner boolean not null default false,
  add column if not exists sparring_intensity text
    check (sparring_intensity is null or sparring_intensity in ('light', 'moderate', 'hard'));

-- Event: safety information
alter table public.events
  add column if not exists safety_rules text,
  add column if not exists prohibited_techniques text,
  add column if not exists requirements text,
  add column if not exists safety_notes text,
  add column if not exists emergency_contact text;

-- Gym follows (wishlist)
create table if not exists public.gym_follows (
  user_id uuid not null references public.profiles (id) on delete cascade,
  gym_id uuid not null references public.gyms (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, gym_id)
);

create index if not exists idx_gym_follows_gym on public.gym_follows (gym_id);

alter table public.gym_follows enable row level security;

drop policy if exists "Users can view own gym follows" on public.gym_follows;
create policy "Users can view own gym follows"
  on public.gym_follows for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can follow gyms" on public.gym_follows;
create policy "Users can follow gyms"
  on public.gym_follows for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can unfollow gyms" on public.gym_follows;
create policy "Users can unfollow gyms"
  on public.gym_follows for delete to authenticated
  using (auth.uid() = user_id);

-- Aggregated participant preview (no personal info)
create or replace function public.get_event_participant_preview(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_total integer;
  v_weight jsonb;
  v_background jsonb;
  v_years jsonb;
  v_sparring jsonb;
begin
  select count(*) into v_total
  from public.registrations r
  where r.event_id = p_event_id
    and r.status in ('pending', 'approved');

  if v_total < 3 then
    return jsonb_build_object('total', v_total, 'hidden', true);
  end if;

  select coalesce(jsonb_object_agg(wc, cnt), '{}'::jsonb) into v_weight
  from (
    select coalesce(nullif(trim(p.weight_class), ''), '미입력') as wc, count(*) as cnt
    from public.registrations r
    join public.profiles p on p.id = r.user_id
    where r.event_id = p_event_id
      and r.status in ('pending', 'approved')
    group by 1
  ) t;

  select coalesce(jsonb_object_agg(bg, cnt), '{}'::jsonb) into v_background
  from (
    select
      case
        when p.experience = '엘리트 선수' then '엘리트 선수 출신'
        when p.experience like '일반 수련자%' then '일반 수련자'
        else '미입력'
      end as bg,
      count(*) as cnt
    from public.registrations r
    join public.profiles p on p.id = r.user_id
    where r.event_id = p_event_id
      and r.status in ('pending', 'approved')
    group by 1
  ) t;

  select coalesce(jsonb_object_agg(yr, cnt), '{}'::jsonb) into v_years
  from (
    select
      case
        when p.experience = '엘리트 선수' then '엘리트 선수'
        when p.experience like '일반 수련자 · %' then split_part(p.experience, ' · ', 2)
        else '미입력'
      end as yr,
      count(*) as cnt
    from public.registrations r
    join public.profiles p on p.id = r.user_id
    where r.event_id = p_event_id
      and r.status in ('pending', 'approved')
    group by 1
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb) into v_sparring
  from (
    select
      coalesce(nullif(trim(p.weight_class), ''), '미입력') as weight_class,
      coalesce(p.experience, '미입력') as experience,
      r.sparring_intensity
    from public.registrations r
    join public.profiles p on p.id = r.user_id
    where r.event_id = p_event_id
      and r.status in ('pending', 'approved')
      and r.seeking_sparring_partner = true
    order by r.created_at
    limit 20
  ) t;

  return jsonb_build_object(
    'total', v_total,
    'hidden', false,
    'weight_classes', v_weight,
    'backgrounds', v_background,
    'experience_years', v_years,
    'sparring_seekers', v_sparring
  );
end;
$$;

grant execute on function public.get_event_participant_preview(uuid) to anon, authenticated;

-- Notify interested users when a new event is published
create or replace function public.notify_interested_users_on_new_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_gym_name text;
  v_is_public boolean;
begin
  select g.name, g.is_public into v_gym_name, v_is_public
  from public.gyms g
  where g.id = new.gym_id;

  if not coalesce(v_is_public, true) then
    return new;
  end if;

  -- Gym followers
  insert into public.notifications (user_id, type, title, body, link)
  select
    gf.user_id,
    'new_event_gym',
    '관심 체육관 새 일정',
    v_gym_name || '에서 새로운 ' || new.sport || ' 일정이 등록되었습니다.',
    '/events/' || new.id
  from public.gym_follows gf
  join public.profiles p on p.id = gf.user_id
  where gf.gym_id = new.gym_id
    and gf.user_id <> new.created_by
    and p.notify_new_events = true;

  -- Region / sport interest
  insert into public.notifications (user_id, type, title, body, link)
  select distinct
    p.id,
    'new_event_region',
    '새 일정 알림',
    new.region || '에 새로운 ' || new.sport || ' 일정이 등록되었습니다.',
    '/events/' || new.id
  from public.profiles p
  where p.notify_new_events = true
    and p.id <> new.created_by
    and not exists (
      select 1 from public.gym_follows gf
      where gf.user_id = p.id and gf.gym_id = new.gym_id
    )
    and (
      '전국' = any(p.regions)
      or exists (
        select 1 from unnest(coalesce(p.regions, '{}')) as r(region)
        where new.region ilike r.region || '%'
           or new.region ilike '%' || r.region || '%'
      )
    )
    and (
      coalesce(array_length(p.preferred_sports, 1), 0) = 0
      or new.sport = any(p.preferred_sports)
    );

  return new;
end;
$$;

drop trigger if exists events_notify_interested on public.events;
create trigger events_notify_interested
  after insert on public.events
  for each row execute function public.notify_interested_users_on_new_event();
