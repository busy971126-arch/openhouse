-- Announcement → participant notifications + operator alert on participant cancel

create or replace function public.notify_on_announcement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
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

drop trigger if exists announcements_notify on public.announcements;
create trigger announcements_notify
  after insert on public.announcements
  for each row execute function public.notify_on_announcement();

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

drop trigger if exists registrations_notify on public.registrations;
create trigger registrations_notify
  after insert or update on public.registrations
  for each row execute function public.notify_on_registration();
