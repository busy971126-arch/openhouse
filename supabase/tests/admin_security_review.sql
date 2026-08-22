-- Local-only Closed Beta admin security review.
-- Never run against Production.
--
-- Covers:
-- * non-admin RPC → exception
-- * admin RPC returns allowlisted columns only
-- * deleting admin_users keeps action logs
-- * inquiry reply → 1 action log
-- * report status change → 1 action log
-- * resolved → reviewing clears resolved_at
-- * service-role/owner UPDATE is not blocked by admin JWT guards

do $$
declare
  v_admin uuid := gen_random_uuid();
  v_user uuid := gen_random_uuid();
  v_inquiry uuid;
  v_report uuid;
  v_log_id uuid;
  v_log_count int;
  v_resolved_at timestamptz;
  v_overview record;
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
      format('admin-%s@local.test', v_admin),
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
      format('user-%s@local.test', v_user),
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
    (v_admin, format('admin-review-%s', substr(v_admin::text, 1, 8)), 'Admin Review'),
    (v_user, format('user-review-%s', substr(v_user::text, 1, 8)), 'User Review')
  on conflict (id) do update
    set nickname = excluded.nickname;

  insert into public.admin_users (user_id) values (v_admin)
  on conflict (user_id) do nothing;

  insert into public.inquiries (user_id, category, message, status)
  values (v_user, 'other', '문의 본문', 'open')
  returning id into v_inquiry;

  insert into public.reports (
    reporter_id,
    reported_user_id,
    category,
    description,
    status
  )
  values (v_user, v_admin, 'other', '신고 본문', 'received')
  returning id into v_report;

  perform set_config('request.jwt.claim.sub', v_user::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user, 'role', 'authenticated')::text,
    true
  );

  begin
    perform * from public.admin_get_overview();
    raise exception 'non-admin RPC should fail';
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

  select * into v_overview from public.admin_get_overview();
  if v_overview is null then
    raise exception 'admin_get_overview returned no row';
  end if;

  foreach v_col in array v_forbidden loop
    if to_jsonb(v_overview) ? v_col then
      raise exception 'admin_get_overview leaked %', v_col;
    end if;
  end loop;

  if exists (
    select 1
    from json_object_keys(row_to_json(v_overview)) as cols(col)
    where cols.col not in (
      'new_users_today',
      'applications_today',
      'events_published_today',
      'active_events_today',
      'pending_application_count',
      'open_inquiry_count',
      'open_report_count',
      'draft_event_count',
      'events_next_7_days',
      'active_application_count'
    )
  ) then
    raise exception 'admin_get_overview returned unexpected columns';
  end if;

  if exists (
    select 1
    from public.admin_get_users('') u
    where to_jsonb(u) ?| v_forbidden
  ) then
    raise exception 'admin_get_users leaked a forbidden column';
  end if;

  update public.inquiries
  set admin_reply = '확인했습니다.', status = 'answered'
  where id = v_inquiry;

  select count(*) into v_log_count
  from public.admin_action_logs
  where target_id = v_inquiry
    and action = 'inquiry.update';

  if v_log_count <> 1 then
    raise exception 'expected 1 inquiry action log, got %', v_log_count;
  end if;

  update public.reports
  set status = 'resolved', resolved_at = now()
  where id = v_report;

  select count(*) into v_log_count
  from public.admin_action_logs
  where target_id = v_report
    and action = 'report.update';

  if v_log_count <> 1 then
    raise exception 'expected 1 report action log, got %', v_log_count;
  end if;

  update public.reports
  set status = 'reviewing', resolved_at = null
  where id = v_report;

  select resolved_at into v_resolved_at
  from public.reports
  where id = v_report;

  if v_resolved_at is not null then
    raise exception 'reviewing should clear resolved_at';
  end if;

  select id into v_log_id
  from public.admin_action_logs
  where target_id = v_inquiry
  limit 1;

  delete from public.admin_users where user_id = v_admin;

  if not exists (
    select 1 from public.admin_action_logs where id = v_log_id
  ) then
    raise exception 'action log was deleted with admin_users';
  end if;

  -- service-role / table owner: no JWT
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);

  update public.inquiries
  set message = '유지보수 본문 수정'
  where id = v_inquiry;

  if not found then
    raise exception 'owner/service-role inquiry update should succeed';
  end if;
end;
$$;
