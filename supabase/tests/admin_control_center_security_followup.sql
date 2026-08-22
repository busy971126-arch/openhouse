-- Local-only security follow-up.
-- Never run against Production.

do $$
declare
  v_admin uuid := gen_random_uuid();
  v_host uuid := gen_random_uuid();
  v_user uuid := gen_random_uuid();
  v_gym uuid;
  v_event uuid;
  v_visible boolean;
  v_logs int;
  v_detail record;
  v_event_row jsonb;
  v_reason text;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name in (
        'admin_hidden_by',
        'admin_recruitment_paused_by',
        'admin_moderation_reason'
      )
  ) then
    raise exception 'public events still has internal admin metadata columns';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values
    (v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     format('sec-admin-%s@local.test', v_admin),
     extensions.crypt('password', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_host, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     format('sec-host-%s@local.test', v_host),
     extensions.crypt('password', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     format('sec-user-%s@local.test', v_user),
     extensions.crypt('password', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now())
  on conflict (id) do nothing;

  insert into public.profiles (id, nickname, display_name)
  values
    (v_admin, format('sec-admin-%s', substr(v_admin::text, 1, 8)), 'Sec Admin'),
    (v_host, format('sec-host-%s', substr(v_host::text, 1, 8)), 'Sec Host'),
    (v_user, format('sec-user-%s', substr(v_user::text, 1, 8)), 'Sec User')
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
    v_gym, v_host, '보안 후속 이벤트', '주짓수', '서울',
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
    perform public.admin_moderate_event(v_event, 'event.hide', '테스트');
    raise exception 'non-admin moderate should fail';
  exception
    when others then
      if sqlerrm not like '%권한%' then
        raise;
      end if;
  end;

  execute 'set local role authenticated';
  begin
    perform public.create_party_registration(
      v_event, '70', '1년', null, null, false, array[v_host]
    );
    raise exception 'authenticated party RPC should fail';
  exception
    when insufficient_privilege then
      null;
    when others then
      if sqlerrm not like '%permission denied%' then
        raise;
      end if;
  end;
  execute 'reset role';

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

  select * into v_detail from public.admin_get_event_detail(v_event);
  if v_detail.last_moderation_reason is distinct from '스팸' then
    raise exception 'admin detail should read latest reason from logs, got %',
      v_detail.last_moderation_reason;
  end if;
  if to_jsonb(v_detail) ? 'admin_moderation_reason' then
    raise exception 'admin detail should not return events.admin_moderation_reason';
  end if;
  if to_jsonb(v_detail) ? 'admin_hidden_by' then
    raise exception 'admin detail leaked admin_hidden_by';
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
  perform public.admin_moderate_event(v_event, 'event.restore', '복구');

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  select exists(select 1 from public.events where id = v_event) into v_visible;
  select to_jsonb(e) into v_event_row from public.events e where e.id = v_event;
  execute 'reset role';
  if not v_visible then
    raise exception 'restored event should be publicly visible';
  end if;
  if v_event_row ?| array[
    'admin_hidden_by',
    'admin_recruitment_paused_by',
    'admin_moderation_reason'
  ] then
    raise exception 'public event row leaked admin metadata: %', v_event_row;
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

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user, 'role', 'authenticated')::text,
    true
  );
  execute 'set local role authenticated';
  perform public.create_solo_registration(v_event, '70', '1년');
  execute 'reset role';

  select count(*) into v_logs
  from public.admin_action_logs
  where target_id = v_event
    and action in (
      'event.hide',
      'event.restore',
      'event.recruitment_pause',
      'event.recruitment_resume'
    );
  if v_logs <> 4 then
    raise exception 'expected 4 event audit logs, got %', v_logs;
  end if;

  perform set_config('request.jwt.claim.sub', v_admin::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text,
    true
  );
  select last_moderation_reason into v_reason
  from public.admin_get_event_detail(v_event);
  if v_reason is distinct from '재개' then
    raise exception 'latest log reason should be 재개, got %', v_reason;
  end if;
end;
$$;
