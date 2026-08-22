-- Local-only: admin can inspect another user's draft/private-gym event.
-- Never run against Production.

do $$
declare
  v_admin uuid := gen_random_uuid();
  v_user uuid := gen_random_uuid();
  v_gym uuid;
  v_event uuid;
  v_detail record;
  v_col text;
  v_forbidden text[] := array[
    'phone',
    'parent_phone',
    'pending_gym_info',
    'emergency_contact',
    'applicant_notes',
    'operator_memo'
  ];
begin
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values
    (
      v_admin,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      format('admin-event-%s@local.test', v_admin),
      extensions.crypt('password', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    ),
    (
      v_user,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      format('user-event-%s@local.test', v_user),
      extensions.crypt('password', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    )
  on conflict (id) do nothing;

  insert into public.profiles (id, nickname, display_name)
  values
    (v_admin, 'admin-event', 'Admin Event'),
    (v_user, 'host-event', 'Host Event')
  on conflict (id) do update
    set nickname = excluded.nickname;

  insert into public.admin_users (user_id) values (v_admin)
  on conflict (user_id) do nothing;

  insert into public.gyms (owner_id, name, sport, region, is_public)
  values (v_user, '비공개 체육관', '주짓수', '서울', false)
  returning id into v_gym;

  insert into public.events (
    gym_id,
    created_by,
    title,
    description,
    sport,
    region,
    event_date,
    event_time,
    event_type,
    status,
    emergency_contact
  )
  values (
    v_gym,
    v_user,
    '타인 드래프트',
    '운영 검수용 설명',
    '주짓수',
    '서울',
    (current_date + 30),
    '18:00',
    'open_mat',
    'draft',
    '010-0000-0000'
  )
  returning id into v_event;

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user, 'role', 'authenticated')::text,
    true
  );

  begin
    perform * from public.admin_get_event_detail(v_event);
    raise exception 'non-admin event detail RPC should fail';
  exception
    when others then
      if sqlerrm not like '%권한%' then
        raise;
      end if;
  end;

  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text,
    true
  );

  select * into v_detail from public.admin_get_event_detail(v_event);

  if v_detail.id is distinct from v_event then
    raise exception 'admin should read another user draft event';
  end if;

  if v_detail.title is distinct from '타인 드래프트' then
    raise exception 'unexpected title %', v_detail.title;
  end if;

  if v_detail.is_publicly_viewable is not false then
    raise exception 'draft/private event must not be publicly viewable';
  end if;

  foreach v_col in array v_forbidden loop
    if to_jsonb(v_detail) ? v_col then
      raise exception 'admin_get_event_detail leaked %', v_col;
    end if;
  end loop;

  if exists (
    select 1
    from json_object_keys(row_to_json(v_detail)) as cols(col)
    where cols.col not in (
      'id',
      'title',
      'sport',
      'event_type',
      'event_date',
      'event_time',
      'status',
      'region',
      'address',
      'gym_id',
      'gym_name',
      'gym_is_public',
      'host_label',
      'max_participants',
      'active_application_count',
      'created_at',
      'description',
      'is_publicly_viewable'
    )
  ) then
    raise exception 'admin_get_event_detail returned unexpected columns';
  end if;
end;
$$;
