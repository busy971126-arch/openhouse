


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."registration_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


ALTER TYPE "public"."registration_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."age_to_age_group"("age_val" integer) RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select case
    when age_val between 10 and 19 then '10대'
    when age_val between 20 and 29 then '20대'
    when age_val between 30 and 39 then '30대'
    when age_val >= 40 then '30+'
    else null
  end;
$$;


ALTER FUNCTION "public"."age_to_age_group"("age_val" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_event_capacity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  cap integer;
  occupied_count integer;
  becoming_occupied boolean;
begin
  becoming_occupied := new.status in ('pending', 'approved')
    and (
      tg_op = 'INSERT'
      or old.status is null
      or old.status not in ('pending', 'approved')
    );

  if not becoming_occupied then
    return new;
  end if;

  select e.max_participants
  into cap
  from public.events e
  where e.id = new.event_id
  for update;

  if cap is null then
    return new;
  end if;

  select count(*)
  into occupied_count
  from public.registrations r
  where r.event_id = new.event_id
    and r.status in ('pending', 'approved')
    and (tg_op = 'INSERT' or r.id <> new.id);

  if occupied_count >= cap then
    raise exception 'Event is full (max % participants)', cap;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."check_event_capacity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_party_registration"("p_event_id" "uuid", "p_apply_weight_class" "text", "p_apply_experience" "text", "p_gym_affiliation" "text" DEFAULT NULL::"text", "p_applicant_notes" "text" DEFAULT NULL::"text", "p_seeking_sparring" boolean DEFAULT false, "p_companion_user_ids" "uuid"[] DEFAULT ARRAY[]::"uuid"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."create_party_registration"("p_event_id" "uuid", "p_apply_weight_class" "text", "p_apply_experience" "text", "p_gym_affiliation" "text", "p_applicant_notes" "text", "p_seeking_sparring" boolean, "p_companion_user_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_solo_registration"("p_event_id" "uuid", "p_apply_weight_class" "text", "p_apply_experience" "text", "p_gym_affiliation" "text" DEFAULT NULL::"text", "p_applicant_notes" "text" DEFAULT NULL::"text", "p_seeking_sparring" boolean DEFAULT false) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."create_solo_registration"("p_event_id" "uuid", "p_apply_weight_class" "text", "p_apply_experience" "text", "p_gym_affiliation" "text", "p_applicant_notes" "text", "p_seeking_sparring" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_event_participant_preview"("p_event_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_total integer;
  v_genders jsonb;
  v_participants jsonb;
  v_weight jsonb;
  v_background jsonb;
  v_years jsonb;
  v_sparring jsonb;
begin
  select count(*) into v_total
  from public.registrations r
  where r.event_id = p_event_id
    and r.status in ('pending', 'approved');

  select coalesce(jsonb_object_agg(g, cnt), '{}'::jsonb) into v_genders
  from (
    select
      case
        when p.gender = '남성' then '남성'
        when p.gender = '여성' then '여성'
        else '미입력'
      end as g,
      count(*) as cnt
    from public.registrations r
    join public.profiles p on p.id = r.user_id
    where r.event_id = p_event_id
      and r.status in ('pending', 'approved')
    group by 1
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb order by t.created_at), '[]'::jsonb)
  into v_participants
  from (
    select
      r.user_id,
      coalesce(nullif(trim(p.nickname), ''), '익명') as nickname,
      case
        when p.gender = '남성' then '남성'
        when p.gender = '여성' then '여성'
        else '미입력'
      end as gender,
      coalesce(
        nullif(trim(r.apply_weight_class), ''),
        nullif(trim(p.weight_class), ''),
        '미입력'
      ) as weight_class,
      coalesce(
        nullif(trim(r.apply_experience), ''),
        nullif(trim(p.experience), ''),
        '미입력'
      ) as experience,
      r.created_at
    from public.registrations r
    join public.profiles p on p.id = r.user_id
    where r.event_id = p_event_id
      and r.status in ('pending', 'approved')
    order by r.created_at
    limit 100
  ) t;

  if v_total < 3 then
    return jsonb_build_object(
      'total', v_total,
      'hidden', true,
      'genders', v_genders,
      'participants', v_participants,
      'weight_classes', '{}'::jsonb,
      'backgrounds', '{}'::jsonb,
      'experience_years', '{}'::jsonb,
      'sparring_seekers', '[]'::jsonb
    );
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
      r.user_id,
      coalesce(nullif(trim(p.nickname), ''), '익명') as nickname,
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
    'genders', v_genders,
    'participants', v_participants,
    'weight_classes', v_weight,
    'backgrounds', v_background,
    'experience_years', v_years,
    'sparring_seekers', v_sparring
  );
end;
$$;


ALTER FUNCTION "public"."get_event_participant_preview"("p_event_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_event_registration_count"("p_event_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select count(*)::integer
  from public.registrations
  where event_id = p_event_id
    and status in ('pending', 'approved');
$$;


ALTER FUNCTION "public"."get_event_registration_count"("p_event_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_event_registration_counts"("p_event_ids" "uuid"[]) RETURNS TABLE("event_id" "uuid", "approved_count" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select r.event_id, count(*)::integer as approved_count
  from public.registrations r
  where r.event_id = any(p_event_ids)
    and r.status in ('pending', 'approved')
  group by r.event_id;
$$;


ALTER FUNCTION "public"."get_event_registration_counts"("p_event_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_pending_gym_info"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select p.pending_gym_info
  from public.profiles p
  where p.id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_pending_gym_info"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_visibility_settings"("p_user_ids" "uuid"[]) RETURNS TABLE("id" "uuid", "visibility_settings" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select p.id, p.visibility_settings
  from public.profiles p
  where auth.uid() is not null
    and p.id = any(p_user_ids);
$$;


ALTER FUNCTION "public"."get_profile_visibility_settings"("p_user_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_public_profile"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select jsonb_build_object(
    'id', p.id,
    'display_name', p.display_name,
    'nickname', p.nickname,
    'gender', p.gender,
    'experience', p.experience,
    'weight_class', p.weight_class,
    'regions', p.regions,
    'preferred_sports', p.preferred_sports,
    'photo_url', p.photo_url,
    'bio', p.bio,
    'created_at', p.created_at,
    'visibility_settings', p.visibility_settings
  )
  from public.profiles p
  where p.id = p_user_id
    and auth.uid() is not null;
$$;


ALTER FUNCTION "public"."get_public_profile"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  meta jsonb := new.raw_user_meta_data;
  age_val integer;
  age_group_val text;
begin
  age_val := case jsonb_typeof(meta -> 'age')
    when 'number' then (meta -> 'age')::text::integer
    when 'string' then nullif(meta ->> 'age', '')::integer
    else null
  end;

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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_event_owner"("event" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.events e
    join public.gyms g on g.id = e.gym_id
    where e.id = event and g.owner_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_event_owner"("event" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_gym_owner"("gym" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.gyms
    where id = gym and owner_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_gym_owner"("gym" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_nickname_available"("p_nickname" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  normalized text;
begin
  normalized := lower(trim(p_nickname));

  if normalized = ''
    or char_length(normalized) < 2
    or char_length(normalized) > 20
  then
    return false;
  end if;

  return not exists (
    select 1
    from public.profiles
    where lower(trim(nickname)) = normalized
  );
end;
$$;


ALTER FUNCTION "public"."is_nickname_available"("p_nickname" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_interested_users_on_new_event"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."notify_interested_users_on_new_event"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_on_announcement"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_event_title text;
  v_preview text;
  v_content text;
begin
  select title into v_event_title
  from public.events
  where id = new.event_id;

  v_content := trim(new.content);
  v_preview := left(v_content, 120);
  if length(v_content) > 120 then
    v_preview := v_preview || '…';
  end if;

  insert into public.notifications (user_id, type, title, body, link)
  select
    r.user_id,
    'event_announcement',
    '새 공지 · ' || coalesce(v_event_title, '이벤트'),
    v_preview,
    '/events/' || new.event_id
  from public.registrations r
  where r.event_id = new.event_id
    and r.status in ('pending', 'approved');

  return new;
end;
$$;


ALTER FUNCTION "public"."notify_on_announcement"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_on_registration"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_owner_id uuid;
  v_event_title text;
begin
  select g.owner_id, e.title
  into v_owner_id, v_event_title
  from public.events e
  join public.gyms g on g.id = e.gym_id
  where e.id = coalesce(new.event_id, old.event_id);

  if tg_op = 'INSERT' and new.status = 'pending' then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      v_owner_id,
      'registration_pending',
      '새 참가 신청',
      v_event_title || ' 일정에 새 신청이 있습니다.',
      '/events/' || new.event_id || '/participants'
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'approved' then
      insert into public.notifications (user_id, type, title, body, link)
      values (
        new.user_id,
        'registration_approved',
        '참가 확정',
        v_event_title || ' 참가가 확정되었습니다.',
        '/my/registrations'
      );
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, type, title, body, link)
      values (
        new.user_id,
        'registration_rejected',
        '참가 미승인',
        v_event_title || ' 참가 신청이 승인되지 않았습니다.',
        '/my/registrations'
      );
    elsif new.status = 'cancelled' and old.status in ('pending', 'approved') then
      insert into public.notifications (user_id, type, title, body, link)
      values (
        v_owner_id,
        'registration_cancelled',
        '참가 취소',
        v_event_title || ' 일정 참가가 취소되었습니다.',
        '/events/' || new.event_id || '/participants'
      );
    end if;
  end if;

  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "public"."notify_on_registration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."resolve_new_registration_status"("p_event_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_auto boolean;
  v_cap integer;
  v_occupied integer;
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
  into v_occupied
  from public.registrations r
  where r.event_id = p_event_id
    and r.status in ('pending', 'approved');

  if v_occupied < v_cap then
    return jsonb_build_object('status', 'approved', 'auto_approved', true);
  end if;

  return jsonb_build_object('status', 'pending', 'auto_approved', false);
end;
$$;


ALTER FUNCTION "public"."resolve_new_registration_status"("p_event_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."resolve_new_registration_status"("p_event_id" "uuid") IS 'Resolves insert status for auto_approve events. Capacity = pending + approved (038).';



CREATE OR REPLACE FUNCTION "public"."search_profiles"("p_query" "text", "p_limit" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "nickname" "text", "display_name" "text", "preferred_sports" "text"[], "photo_url" "text", "weight_class" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    p.id,
    p.nickname,
    p.display_name,
    p.preferred_sports,
    p.photo_url,
    p.weight_class
  from public.profiles p
  where auth.uid() is not null
    and p.id <> auth.uid()
    and length(trim(coalesce(p_query, ''))) >= 2
    and (
      p.nickname ilike '%' || trim(p_query) || '%'
      or p.display_name ilike '%' || trim(p_query) || '%'
    )
  order by p.nickname nulls last, p.display_name nulls last
  limit greatest(1, least(coalesce(p_limit, 10), 20));
$$;


ALTER FUNCTION "public"."search_profiles"("p_query" "text", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_registration_status"("p_registration_id" "uuid", "p_status" "public"."registration_status") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user uuid := auth.uid();
  v_registration public.registrations%rowtype;
begin
  if v_user is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  select *
  into v_registration
  from public.registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'REGISTRATION_NOT_FOUND';
  end if;

  if p_status in ('approved', 'rejected') then
    if not public.is_event_owner(v_registration.event_id) then
      raise exception 'NOT_EVENT_OWNER';
    end if;

    if v_registration.status <> 'pending' then
      raise exception 'INVALID_STATUS_TRANSITION';
    end if;
  elsif p_status = 'cancelled' then
    if v_registration.user_id <> v_user
      and not (
        v_registration.party_representative_user_id = v_user
        and v_registration.party_id is not null
      ) then
      raise exception 'NOT_ALLOWED';
    end if;
  elsif p_status = 'pending' then
    if not public.is_event_owner(v_registration.event_id) then
      raise exception 'NOT_EVENT_OWNER';
    end if;
  else
    raise exception 'INVALID_STATUS';
  end if;

  update public.registrations
  set status = p_status
  where id = p_registration_id;
end;
$$;


ALTER FUNCTION "public"."update_registration_status"("p_registration_id" "uuid", "p_status" "public"."registration_status") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_party_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select distinct party_id
  from public.registrations
  where user_id = auth.uid()
    and party_id is not null;
$$;


ALTER FUNCTION "public"."user_party_ids"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_interests" (
    "user_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."event_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gym_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "sport" "text" NOT NULL,
    "region" "text" NOT NULL,
    "event_date" "date" NOT NULL,
    "event_time" time without time zone,
    "max_participants" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recruitment_closed" boolean DEFAULT false NOT NULL,
    "event_type" "text" DEFAULT 'open_mat'::"text" NOT NULL,
    "safety_rules" "text",
    "prohibited_techniques" "text",
    "requirements" "text",
    "safety_notes" "text",
    "emergency_contact" "text",
    "fee_amount" integer,
    "registration_deadline" "date",
    "difficulty" "text",
    "gi_rental" "text",
    "visit_details" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "recurring_days" "text"[],
    CONSTRAINT "events_difficulty_check" CHECK ((("difficulty" IS NULL) OR ("difficulty" = ANY (ARRAY['beginner'::"text", 'experienced'::"text", 'athlete'::"text"])))),
    CONSTRAINT "events_event_type_check" CHECK (("event_type" = ANY (ARRAY['open_mat'::"text", 'seminar'::"text", 'competition'::"text"]))),
    CONSTRAINT "events_fee_amount_check" CHECK ((("fee_amount" IS NULL) OR ("fee_amount" >= 0))),
    CONSTRAINT "events_max_participants_check" CHECK ((("max_participants" IS NULL) OR ("max_participants" > 0))),
    CONSTRAINT "events_recurring_days_valid" CHECK ((("recurring_days" IS NULL) OR ("cardinality"("recurring_days") = 0) OR ("recurring_days" <@ ARRAY['mon'::"text", 'tue'::"text", 'wed'::"text", 'thu'::"text", 'fri'::"text", 'sat'::"text", 'sun'::"text"]))),
    CONSTRAINT "events_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON COLUMN "public"."events"."recurring_days" IS 'Optional weekday codes (mon–sun) for recurring schedules. Null or empty for one-off events.';



CREATE TABLE IF NOT EXISTS "public"."friendships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "addressee_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "friendships_no_self" CHECK (("requester_id" <> "addressee_id")),
    CONSTRAINT "friendships_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."friendships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gym_follows" (
    "user_id" "uuid" NOT NULL,
    "gym_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."gym_follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gyms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "region" "text" NOT NULL,
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "representative_name" "text",
    "representative_phone" "text",
    "photo_url" "text",
    "description" "text",
    "sns_url" "text",
    "operating_hours" "text",
    "is_public" boolean DEFAULT true NOT NULL,
    "sport" "text" DEFAULT '유도'::"text" NOT NULL,
    "phone" "text",
    "instagram_url" "text",
    "homepage_url" "text",
    "closed_days" "text",
    "facilities" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "facility_notes" "text",
    "class_schedule" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "first_visit_welcome" boolean,
    "walk_in_visits" boolean,
    "gi_rental" "text",
    "visit_details" "text",
    "preparation_guide" "text",
    "training_styles" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "gym_tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "mat_photos" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "facility_photos" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "exterior_photos" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "parking_photos" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "representative_role" "text",
    "representative_role_custom" "text"
);


ALTER TABLE "public"."gyms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inquiries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "admin_reply" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "inquiries_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'answered'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."inquiries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "link" "text",
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_feed_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_type" "text" DEFAULT 'photo'::"text" NOT NULL,
    "caption" "text",
    "event_id" "uuid",
    "photo_urls" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profile_feed_posts_post_type_check" CHECK (("post_type" = 'photo'::"text"))
);


ALTER TABLE "public"."profile_feed_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "gender" "text",
    "age_group" "text",
    "experience" "text",
    "phone" "text",
    "regions" "text"[] DEFAULT '{}'::"text"[],
    "preferred_sports" "text"[] DEFAULT '{}'::"text"[],
    "age" integer,
    "nickname" "text",
    "photo_url" "text",
    "bio" "text",
    "weight_class" "text",
    "notify_new_events" boolean DEFAULT true NOT NULL,
    "parent_phone" "text",
    "visibility_settings" "jsonb" DEFAULT '{"bio": "public", "phone": "private", "regions": "public", "experience": "public", "parent_phone": "private", "weight_class": "public", "gym_affiliation": "public", "preferred_sports": "public"}'::"jsonb" NOT NULL,
    "pending_gym_info" "jsonb"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."pending_gym_info" IS 'Temporary gym draft when operator signup completes before session (email confirm). Cleared after gym insert.';



CREATE TABLE IF NOT EXISTS "public"."registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."registration_status" DEFAULT 'pending'::"public"."registration_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "operator_memo" "text",
    "seeking_sparring_partner" boolean DEFAULT false NOT NULL,
    "sparring_intensity" "text",
    "apply_weight_class" "text",
    "apply_experience" "text",
    "gym_affiliation" "text",
    "applicant_notes" "text",
    "payment_confirmed" boolean DEFAULT false NOT NULL,
    "party_id" "uuid",
    "party_representative_user_id" "uuid",
    CONSTRAINT "registrations_sparring_intensity_check" CHECK ((("sparring_intensity" IS NULL) OR ("sparring_intensity" = ANY (ARRAY['light'::"text", 'moderate'::"text", 'hard'::"text"]))))
);


ALTER TABLE "public"."registrations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."registrations"."payment_confirmed" IS 'Event host marked participation fee as received';



CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "reported_user_id" "uuid",
    "event_id" "uuid",
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'received'::"text" NOT NULL,
    "admin_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    CONSTRAINT "reports_category_check" CHECK (("category" = ANY (ARRAY['no_show'::"text", 'abuse'::"text", 'misinformation'::"text", 'inappropriate'::"text", 'other'::"text"]))),
    CONSTRAINT "reports_status_check" CHECK (("status" = ANY (ARRAY['received'::"text", 'reviewing'::"text", 'resolved'::"text"]))),
    CONSTRAINT "reports_target_required" CHECK ((("reported_user_id" IS NOT NULL) OR ("event_id" IS NOT NULL)))
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_interests"
    ADD CONSTRAINT "event_interests_pkey" PRIMARY KEY ("user_id", "event_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gym_follows"
    ADD CONSTRAINT "gym_follows_pkey" PRIMARY KEY ("user_id", "gym_id");



ALTER TABLE ONLY "public"."gyms"
    ADD CONSTRAINT "gyms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_feed_posts"
    ADD CONSTRAINT "profile_feed_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_announcements_event" ON "public"."announcements" USING "btree" ("event_id");



CREATE INDEX "idx_event_interests_event" ON "public"."event_interests" USING "btree" ("event_id");



CREATE INDEX "idx_events_date" ON "public"."events" USING "btree" ("event_date");



CREATE INDEX "idx_events_gym" ON "public"."events" USING "btree" ("gym_id");



CREATE INDEX "idx_events_region" ON "public"."events" USING "btree" ("region");



CREATE INDEX "idx_events_sport" ON "public"."events" USING "btree" ("sport");



CREATE INDEX "idx_friendships_addressee" ON "public"."friendships" USING "btree" ("addressee_id", "status");



CREATE UNIQUE INDEX "idx_friendships_pair_unique" ON "public"."friendships" USING "btree" (LEAST("requester_id", "addressee_id"), GREATEST("requester_id", "addressee_id"));



CREATE INDEX "idx_friendships_requester" ON "public"."friendships" USING "btree" ("requester_id", "status");



CREATE INDEX "idx_gym_follows_gym" ON "public"."gym_follows" USING "btree" ("gym_id");



CREATE INDEX "idx_gyms_owner" ON "public"."gyms" USING "btree" ("owner_id");



CREATE INDEX "idx_inquiries_user" ON "public"."inquiries" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_profile_feed_posts_user" ON "public"."profile_feed_posts" USING "btree" ("user_id", "created_at" DESC);



CREATE UNIQUE INDEX "idx_profiles_nickname_unique" ON "public"."profiles" USING "btree" ("lower"(TRIM(BOTH FROM "nickname"))) WHERE (("nickname" IS NOT NULL) AND (TRIM(BOTH FROM "nickname") <> ''::"text"));



CREATE UNIQUE INDEX "idx_registrations_active_unique" ON "public"."registrations" USING "btree" ("event_id", "user_id") WHERE ("status" = ANY (ARRAY['pending'::"public"."registration_status", 'approved'::"public"."registration_status"]));



CREATE INDEX "idx_registrations_event" ON "public"."registrations" USING "btree" ("event_id");



CREATE INDEX "idx_registrations_party" ON "public"."registrations" USING "btree" ("party_id") WHERE ("party_id" IS NOT NULL);



CREATE INDEX "idx_registrations_user" ON "public"."registrations" USING "btree" ("user_id");



CREATE INDEX "idx_reports_reporter" ON "public"."reports" USING "btree" ("reporter_id", "created_at" DESC);



CREATE INDEX "idx_reports_status" ON "public"."reports" USING "btree" ("status", "created_at" DESC);



CREATE OR REPLACE TRIGGER "announcements_notify" AFTER INSERT ON "public"."announcements" FOR EACH ROW EXECUTE FUNCTION "public"."notify_on_announcement"();



CREATE OR REPLACE TRIGGER "events_notify_interested" AFTER INSERT ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."notify_interested_users_on_new_event"();



CREATE OR REPLACE TRIGGER "registrations_capacity_check" BEFORE INSERT OR UPDATE ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."check_event_capacity"();



CREATE OR REPLACE TRIGGER "registrations_notify" AFTER INSERT OR UPDATE ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."notify_on_registration"();



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_interests"
    ADD CONSTRAINT "event_interests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_interests"
    ADD CONSTRAINT "event_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_follows"
    ADD CONSTRAINT "gym_follows_gym_id_fkey" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gym_follows"
    ADD CONSTRAINT "gym_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gyms"
    ADD CONSTRAINT "gyms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_feed_posts"
    ADD CONSTRAINT "profile_feed_posts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profile_feed_posts"
    ADD CONSTRAINT "profile_feed_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_party_representative_user_id_fkey" FOREIGN KEY ("party_representative_user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Announcements are viewable by everyone" ON "public"."announcements" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can create gyms" ON "public"."gyms" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Authenticated users can read feed posts" ON "public"."profile_feed_posts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can register" ON "public"."registrations" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND ("status" = 'pending'::"public"."registration_status")));



CREATE POLICY "Event hosts can view registrant profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("public"."registrations" "r"
     JOIN "public"."events" "e" ON (("e"."id" = "r"."event_id")))
     JOIN "public"."gyms" "g" ON (("g"."id" = "e"."gym_id")))
  WHERE (("r"."user_id" = "profiles"."id") AND ("g"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Event owners can create announcements" ON "public"."announcements" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_event_owner"("event_id") AND ("auth"."uid"() = "author_id")));



CREATE POLICY "Event owners can delete announcements" ON "public"."announcements" FOR DELETE TO "authenticated" USING ("public"."is_event_owner"("event_id"));



CREATE POLICY "Event owners can manage registrations" ON "public"."registrations" FOR UPDATE TO "authenticated" USING ("public"."is_event_owner"("event_id")) WITH CHECK (("status" = ANY (ARRAY['approved'::"public"."registration_status", 'rejected'::"public"."registration_status", 'cancelled'::"public"."registration_status", 'pending'::"public"."registration_status"])));



CREATE POLICY "Event owners can update announcements" ON "public"."announcements" FOR UPDATE TO "authenticated" USING ("public"."is_event_owner"("event_id"));



CREATE POLICY "Event owners can view registrations" ON "public"."registrations" FOR SELECT TO "authenticated" USING ("public"."is_event_owner"("event_id"));



CREATE POLICY "Events are viewable by everyone" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "Friends can view accepted friend profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."friendships" "f"
  WHERE (("f"."status" = 'accepted'::"text") AND ((("f"."requester_id" = "auth"."uid"()) AND ("f"."addressee_id" = "profiles"."id")) OR (("f"."addressee_id" = "auth"."uid"()) AND ("f"."requester_id" = "profiles"."id")))))));



CREATE POLICY "Gym owners can create events" ON "public"."events" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_gym_owner"("gym_id") AND ("auth"."uid"() = "created_by")));



CREATE POLICY "Gym owners can delete own events" ON "public"."events" FOR DELETE TO "authenticated" USING ("public"."is_gym_owner"("gym_id"));



CREATE POLICY "Gym owners can delete own gyms" ON "public"."gyms" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Gym owners can update own events" ON "public"."events" FOR UPDATE TO "authenticated" USING ("public"."is_gym_owner"("gym_id"));



CREATE POLICY "Gym owners can update own gyms" ON "public"."gyms" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Gyms are viewable by everyone" ON "public"."gyms" FOR SELECT USING (true);



CREATE POLICY "Party members can view party registrations" ON "public"."registrations" FOR SELECT TO "authenticated" USING ((("party_id" IS NOT NULL) AND ("party_id" IN ( SELECT "public"."user_party_ids"() AS "user_party_ids"))));



CREATE POLICY "Party representative can cancel party" ON "public"."registrations" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR (("party_representative_user_id" = "auth"."uid"()) AND ("party_id" IS NOT NULL)))) WITH CHECK (("status" = 'cancelled'::"public"."registration_status"));



CREATE POLICY "Users can add event interests" ON "public"."event_interests" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can cancel own registration" ON "public"."registrations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("status" = 'cancelled'::"public"."registration_status"));



CREATE POLICY "Users can create inquiries" ON "public"."inquiries" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND ("status" = 'open'::"text")));



CREATE POLICY "Users can create reports" ON "public"."reports" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "reporter_id") AND ("status" = 'received'::"text")));



CREATE POLICY "Users can delete own feed posts" ON "public"."profile_feed_posts" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own friendships" ON "public"."friendships" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "requester_id") OR ("auth"."uid"() = "addressee_id")));



CREATE POLICY "Users can follow gyms" ON "public"."gym_follows" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own feed posts" ON "public"."profile_feed_posts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can remove event interests" ON "public"."event_interests" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can respond to friend requests" ON "public"."friendships" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "requester_id") OR ("auth"."uid"() = "addressee_id"))) WITH CHECK ((("auth"."uid"() = "requester_id") OR ("auth"."uid"() = "addressee_id")));



CREATE POLICY "Users can send friend requests" ON "public"."friendships" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "requester_id") AND ("status" = 'pending'::"text")));



CREATE POLICY "Users can unfollow gyms" ON "public"."gym_follows" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own event interests" ON "public"."event_interests" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own friendships" ON "public"."friendships" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "requester_id") OR ("auth"."uid"() = "addressee_id")));



CREATE POLICY "Users can view own gym follows" ON "public"."gym_follows" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own inquiries" ON "public"."inquiries" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own registrations" ON "public"."registrations" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own reports" ON "public"."reports" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "reporter_id"));



ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_interests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friendships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gym_follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gyms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inquiries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_feed_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."age_to_age_group"("age_val" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."age_to_age_group"("age_val" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."age_to_age_group"("age_val" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_event_capacity"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_event_capacity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_event_capacity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_party_registration"("p_event_id" "uuid", "p_apply_weight_class" "text", "p_apply_experience" "text", "p_gym_affiliation" "text", "p_applicant_notes" "text", "p_seeking_sparring" boolean, "p_companion_user_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_party_registration"("p_event_id" "uuid", "p_apply_weight_class" "text", "p_apply_experience" "text", "p_gym_affiliation" "text", "p_applicant_notes" "text", "p_seeking_sparring" boolean, "p_companion_user_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_party_registration"("p_event_id" "uuid", "p_apply_weight_class" "text", "p_apply_experience" "text", "p_gym_affiliation" "text", "p_applicant_notes" "text", "p_seeking_sparring" boolean, "p_companion_user_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_solo_registration"("p_event_id" "uuid", "p_apply_weight_class" "text", "p_apply_experience" "text", "p_gym_affiliation" "text", "p_applicant_notes" "text", "p_seeking_sparring" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_solo_registration"("p_event_id" "uuid", "p_apply_weight_class" "text", "p_apply_experience" "text", "p_gym_affiliation" "text", "p_applicant_notes" "text", "p_seeking_sparring" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_solo_registration"("p_event_id" "uuid", "p_apply_weight_class" "text", "p_apply_experience" "text", "p_gym_affiliation" "text", "p_applicant_notes" "text", "p_seeking_sparring" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event_participant_preview"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_participant_preview"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_participant_preview"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event_registration_count"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_registration_count"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_registration_count"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event_registration_counts"("p_event_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_registration_counts"("p_event_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_registration_counts"("p_event_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_pending_gym_info"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_pending_gym_info"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_pending_gym_info"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_visibility_settings"("p_user_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_profile_visibility_settings"("p_user_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_visibility_settings"("p_user_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_public_profile"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_profile"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_profile"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_event_owner"("event" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_event_owner"("event" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_event_owner"("event" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_gym_owner"("gym" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_gym_owner"("gym" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_gym_owner"("gym" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_nickname_available"("p_nickname" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_nickname_available"("p_nickname" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_nickname_available"("p_nickname" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_interested_users_on_new_event"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_interested_users_on_new_event"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_interested_users_on_new_event"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_on_announcement"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_on_announcement"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_on_announcement"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_on_registration"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_on_registration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_on_registration"() TO "service_role";



GRANT ALL ON FUNCTION "public"."resolve_new_registration_status"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."resolve_new_registration_status"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."resolve_new_registration_status"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_profiles"("p_query" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_profiles"("p_query" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_profiles"("p_query" "text", "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_registration_status"("p_registration_id" "uuid", "p_status" "public"."registration_status") TO "anon";
GRANT ALL ON FUNCTION "public"."update_registration_status"("p_registration_id" "uuid", "p_status" "public"."registration_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_registration_status"("p_registration_id" "uuid", "p_status" "public"."registration_status") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_party_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_party_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_party_ids"() TO "service_role";


















GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."event_interests" TO "anon";
GRANT ALL ON TABLE "public"."event_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."event_interests" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."friendships" TO "anon";
GRANT ALL ON TABLE "public"."friendships" TO "authenticated";
GRANT ALL ON TABLE "public"."friendships" TO "service_role";



GRANT ALL ON TABLE "public"."gym_follows" TO "anon";
GRANT ALL ON TABLE "public"."gym_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."gym_follows" TO "service_role";



GRANT ALL ON TABLE "public"."gyms" TO "anon";
GRANT ALL ON TABLE "public"."gyms" TO "authenticated";
GRANT ALL ON TABLE "public"."gyms" TO "service_role";



GRANT ALL ON TABLE "public"."inquiries" TO "anon";
GRANT ALL ON TABLE "public"."inquiries" TO "authenticated";
GRANT ALL ON TABLE "public"."inquiries" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profile_feed_posts" TO "anon";
GRANT ALL ON TABLE "public"."profile_feed_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_feed_posts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."registrations" TO "anon";
GRANT ALL ON TABLE "public"."registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."registrations" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































