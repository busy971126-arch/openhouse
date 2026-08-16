-- Event participant preview: gender stats + anonymized participant list

create or replace function public.get_event_participant_preview(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
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

grant execute on function public.get_event_participant_preview(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
