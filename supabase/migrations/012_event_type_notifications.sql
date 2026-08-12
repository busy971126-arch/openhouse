-- Event type + in-app notifications

alter table public.events
  add column if not exists event_type text not null default 'open_mat'
  check (event_type in ('open_mat', 'seminar', 'competition'));

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id);

create or replace function public.notify_on_registration()
returns trigger
language plpgsql
security definer set search_path = public
as $$
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
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists registrations_notify on public.registrations;
create trigger registrations_notify
  after insert or update on public.registrations
  for each row execute function public.notify_on_registration();
