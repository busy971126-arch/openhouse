-- Event meta (fee, deadline, difficulty) + apply-time registration fields

alter table public.events
  add column if not exists fee_amount integer check (fee_amount is null or fee_amount >= 0),
  add column if not exists registration_deadline date,
  add column if not exists difficulty text check (
    difficulty is null or difficulty in ('beginner', 'experienced', 'athlete')
  );

alter table public.registrations
  add column if not exists apply_weight_class text,
  add column if not exists apply_experience text,
  add column if not exists gym_affiliation text,
  add column if not exists applicant_notes text;

-- Preview RPC: support new experience backgrounds + registration snapshots
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
    select
      coalesce(
        nullif(trim(r.apply_weight_class), ''),
        nullif(trim(p.weight_class), ''),
        '미입력'
      ) as wc,
      count(*) as cnt
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
        when coalesce(r.apply_experience, p.experience) in ('엘리트 선수', '선수 출신') then '선수 출신'
        when coalesce(r.apply_experience, p.experience) = '지도자' then '지도자'
        when coalesce(r.apply_experience, p.experience) like '일반 수련자%' then '일반 수련자'
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
        when coalesce(r.apply_experience, p.experience) in ('엘리트 선수', '선수 출신', '지도자') then '해당 없음'
        when coalesce(r.apply_experience, p.experience) like '일반 수련자 · %'
          then split_part(coalesce(r.apply_experience, p.experience), ' · ', 2)
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
      coalesce(nullif(trim(p.nickname), ''), '익명') as nickname,
      coalesce(
        nullif(trim(r.apply_weight_class), ''),
        nullif(trim(p.weight_class), ''),
        '미입력'
      ) as weight_class,
      coalesce(r.apply_experience, p.experience, '미입력') as experience
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
