-- Local-only Admin Control Center Phase 1 checks.
-- Never run against Production.

do $$
declare
  v_admin uuid := gen_random_uuid();
  v_host uuid := gen_random_uuid();
  v_user uuid := gen_random_uuid();
  v_gym uuid;
  v_event uuid;
  v_visible boolean;
  v_count int;
  v_logs int;
  v_kst_next date := (timezone('Asia/Seoul', timestamptz '2026-08-21 15:00:00+00'))::date;
  v_kst_prev date := (timezone('Asia/Seoul', timestamptz '2026-08-21 14:59:00+00'))::date;
begin
  if v_kst_next is distinct from date '2026-08-22' then
    raise exception 'KST boundary 15:00 UTC should be Aug 22';
  end if;
  if v_kst_prev is distinct from date '2026-08-21' then
    raise exception 'KST boundary 14:59 UTC should be Aug 21';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values
    (v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     format('acc-admin-%s@local.test', v_admin),
     extensions.crypt('password', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_host, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     format('acc-host-%s@local.test', v_host),
     extensions.crypt('password', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     format('acc-user-%s@local.test', v_user),
     extensions.crypt('password', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now())
  on conflict (id) do nothing;

  insert into public.profiles (id, nickname, display_name)
  values (v_admin, format('acc-admin-%s', substr(v_admin::text, 1, 8)), 'Acc Admin'),
         (v_host, format('acc-host-%s', substr(v_host::text, 1, 8)), 'Acc Host'),
         (v_user, format('acc-user-%s', substr(v_user::text, 1, 8)), 'Acc User')
  on conflict (id) do update set nickname = excluded.nickname;

  insert into public.admin_users (user_id) values (v_admin)
  on conflict (user_id) do nothing;

  insert into public.gyms (owner_id, name, sport, region, is_public)
  values (v_host, '공개 체육관', '주짓수', '서울', true)
  returning id into v_gym;

  insert into public.events (
    gym_id, created_by, title, sport, region, event_date, event_time, event_type, status
  )
  values (
    v_gym, v_host, '운영 검수 이벤트', '주짓수', '서울',
    (current_date + 40), '19:00', 'open_mat', 'active'
  )
  returning id into v_event;

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user, 'role', 'authenticated')::text,
    true
  );

  begin
    perform * from public.admin_get_applications('', null);
    raise exception 'non-admin applications RPC should fail';
  exception
    when others then
      if sqlerrm not like '%권한%' then
        raise;
      end if;
  end;

  begin
    perform public.admin_moderate_event(v_event, 'event.hide', '테스트');
    raise exception 'non-admin moderate should fail';
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

  perform public.admin_moderate_event(v_event, 'event.hide', '스팸');

  select count(*) into v_logs
  from public.admin_action_logs
  where target_id = v_event and action = 'event.hide';
  if v_logs <> 1 then
    raise exception 'expected 1 hide audit log, got %', v_logs;
  end if;

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  select exists(select 1 from public.events where id = v_event) into v_visible;
  execute 'reset role';
  if v_visible then
    raise exception 'hidden event should not be visible to non-host';
  end if;

  perform set_config('request.jwt.claim.sub', v_host::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_host, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  select exists(select 1 from public.events where id = v_event) into v_visible;
  execute 'reset role';
  if not v_visible then
    raise exception 'host should still see own hidden event';
  end if;

  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text,
    true
  );

  begin
    perform public.admin_moderate_event(v_event, 'event.hide', '다시');
    raise exception 'duplicate hide should fail';
  exception
    when others then
      if sqlerrm not like '%이미%' then
        raise;
      end if;
  end;

  perform public.admin_moderate_event(v_event, 'event.restore', '복구');

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  select exists(select 1 from public.events where id = v_event) into v_visible;
  execute 'reset role';
  if not v_visible then
    raise exception 'restored event should be publicly visible';
  end if;

  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text,
    true
  );
  perform public.admin_moderate_event(v_event, 'event.recruitment_pause', '점검');

  begin
    insert into public.registrations (event_id, user_id, status)
    values (v_event, v_user, 'pending');
    raise exception 'paused event should reject new registration';
  exception
    when others then
      if sqlerrm not like '%REGISTRATION_CLOSED%' then
        raise;
      end if;
  end;

  perform public.admin_moderate_event(v_event, 'event.recruitment_resume', '재개');

  insert into public.registrations (
    event_id, user_id, status, apply_weight_class, apply_experience
  )
  values (v_event, v_user, 'pending', '70', '1년');

  select count(*) into v_count
  from public.admin_action_logs
  where target_id = v_event
    and action in (
      'event.hide',
      'event.restore',
      'event.recruitment_pause',
      'event.recruitment_resume'
    );
  if v_count <> 4 then
    raise exception 'expected 4 event audit logs, got %', v_count;
  end if;

  if exists (
    select 1
    from public.admin_get_applications('', null) a
    where to_jsonb(a) ?| array['phone', 'parent_phone', 'applicant_notes']
  ) then
    raise exception 'application RPC leaked a forbidden column';
  end if;

  begin
    perform public.admin_moderate_event(v_event, 'event.delete', '삭제');
    raise exception 'invalid action should fail';
  exception
    when others then
      if sqlerrm not like '%올바른 작업%' then
        raise;
      end if;
  end;

  begin
    perform public.admin_moderate_event(
      v_event,
      'event.hide',
      repeat('가', 501)
    );
    raise exception 'long reason should fail';
  exception
    when others then
      if sqlerrm not like '%너무 깁니다%' then
        raise;
      end if;
  end;
end;
$$;
