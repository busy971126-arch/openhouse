-- Closed Beta admin panel: admin_users, is_admin(), action logs, admin RLS.
-- Does not seed any admin account. Insert user_id in SQL Editor after deploy.
-- Does not grant destructive write access on users, gyms, or events.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Closed Beta operators. Insert user_id manually; never seed by email.';

create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.admin_users (user_id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  constraint admin_action_logs_action_check
    check (action in ('inquiry.update', 'report.update')),
  constraint admin_action_logs_target_type_check
    check (target_type in ('inquiry', 'report'))
);

create index if not exists idx_admin_action_logs_created
  on public.admin_action_logs (created_at desc);

create index if not exists idx_inquiries_status
  on public.inquiries (status, created_at desc);

comment on table public.admin_action_logs is
  'Admin mutations only. Do not copy inquiry/report message bodies.';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

comment on function public.is_admin() is
  'True when auth.uid() is in admin_users. Used by RLS and server guards.';

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

alter table public.admin_users enable row level security;
alter table public.admin_action_logs enable row level security;

drop policy if exists "Admins can view admin users" on public.admin_users;
create policy "Admins can view admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view action logs" on public.admin_action_logs;
create policy "Admins can view action logs"
on public.admin_action_logs
for select
to authenticated
using (public.is_admin());

-- Writes go through SECURITY DEFINER triggers (table owner), not client insert.

drop policy if exists "Admins can view all inquiries" on public.inquiries;
create policy "Admins can view all inquiries"
on public.inquiries
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update inquiries" on public.inquiries;
create policy "Admins can update inquiries"
on public.inquiries
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can view all reports" on public.reports;
create policy "Admins can view all reports"
on public.reports
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update reports" on public.reports;
create policy "Admins can update reports"
on public.reports
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can view all gyms" on public.gyms;
create policy "Admins can view all gyms"
on public.gyms
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all events" on public.events;
create policy "Admins can view all events"
on public.events
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can view all registrations" on public.registrations;
create policy "Admins can view all registrations"
on public.registrations
for select
to authenticated
using (public.is_admin());

create or replace function public.guard_inquiry_admin_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception '문의를 수정할 권한이 없습니다.';
  end if;

  if (
    to_jsonb(new) - array['status', 'admin_reply']::text[]
    is distinct from
    to_jsonb(old) - array['status', 'admin_reply']::text[]
  ) then
    raise exception '문의 원본은 수정할 수 없습니다.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_inquiry_admin_update_trigger on public.inquiries;
create trigger guard_inquiry_admin_update_trigger
before update on public.inquiries
for each row
execute function public.guard_inquiry_admin_update();

create or replace function public.guard_report_admin_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception '신고를 수정할 권한이 없습니다.';
  end if;

  if (
    to_jsonb(new) - array['status', 'admin_note', 'resolved_at']::text[]
    is distinct from
    to_jsonb(old) - array['status', 'admin_note', 'resolved_at']::text[]
  ) then
    raise exception '신고 원본은 수정할 수 없습니다.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_report_admin_update_trigger on public.reports;
create trigger guard_report_admin_update_trigger
before update on public.reports
for each row
execute function public.guard_report_admin_update();

create or replace function public.log_admin_inquiry_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is not distinct from new.status
     and old.admin_reply is not distinct from new.admin_reply then
    return new;
  end if;

  insert into public.admin_action_logs (
    admin_user_id,
    action,
    target_type,
    target_id
  )
  values (
    auth.uid(),
    'inquiry.update',
    'inquiry',
    new.id
  );

  return new;
end;
$$;

drop trigger if exists log_admin_inquiry_update_trigger on public.inquiries;
create trigger log_admin_inquiry_update_trigger
after update on public.inquiries
for each row
execute function public.log_admin_inquiry_update();

create or replace function public.log_admin_report_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is not distinct from new.status
     and old.admin_note is not distinct from new.admin_note
     and old.resolved_at is not distinct from new.resolved_at then
    return new;
  end if;

  insert into public.admin_action_logs (
    admin_user_id,
    action,
    target_type,
    target_id
  )
  values (
    auth.uid(),
    'report.update',
    'report',
    new.id
  );

  return new;
end;
$$;

drop trigger if exists log_admin_report_update_trigger on public.reports;
create trigger log_admin_report_update_trigger
after update on public.reports
for each row
execute function public.log_admin_report_update();

revoke all on table public.admin_users from anon;
revoke all on table public.admin_action_logs from anon;
grant select on table public.admin_users to authenticated;
grant select on table public.admin_action_logs to authenticated;
grant all on table public.admin_users to service_role;
grant all on table public.admin_action_logs to service_role;
