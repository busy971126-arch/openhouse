-- Closed Beta P1 hardening: lifecycle-safe deletes, event date validation,
-- and private gym visibility at the database boundary.

-- Published/cancelled events keep their registration history. Only drafts may be deleted.
drop policy if exists "Gym owners can delete own events" on public.events;
create policy "Gym owners can delete draft events"
on public.events
for delete
to authenticated
using (
  public.is_gym_owner(gym_id)
  and status = 'draft'
);

-- Private gyms are visible only to their owner; public gyms remain discoverable to everyone.
drop policy if exists "Gyms are viewable by everyone" on public.gyms;
drop policy if exists "Public gyms are viewable; owners can view own gyms" on public.gyms;
create policy "Public gyms are viewable; owners can view own gyms"
on public.gyms
for select
to public
using (
  coalesce(is_public, false) = true
  or owner_id = auth.uid()
);

create or replace function public.validate_event_beta_fields()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  v_now timestamp := timezone('Asia/Seoul', now());
  v_event_start timestamp;
  v_check_start boolean := false;
  v_check_deadline boolean := false;
begin
  if new.event_date is null then
    raise exception '이벤트 날짜를 입력해주세요.';
  end if;

  if new.event_time is null then
    raise exception '이벤트 시작 시간을 입력해주세요.';
  end if;

  v_event_start := new.event_date + new.event_time;

  if tg_op = 'INSERT' then
    v_check_start := true;
    v_check_deadline := true;
  else
    v_check_start :=
      new.event_date is distinct from old.event_date
      or new.event_time is distinct from old.event_time
      or (
        coalesce(old.status, 'active') = 'draft'
        and coalesce(new.status, 'active') = 'active'
      );

    v_check_deadline :=
      new.registration_deadline is distinct from old.registration_deadline
      or new.event_date is distinct from old.event_date;
  end if;

  if v_check_start and v_event_start <= v_now then
    raise exception '이벤트 날짜와 시작 시간은 현재 시각 이후로 설정해주세요.';
  end if;

  if v_check_deadline and new.registration_deadline is not null then
    if new.registration_deadline > new.event_date then
      raise exception '신청 마감일은 이벤트 날짜 이후로 설정할 수 없습니다.';
    end if;

    if new.registration_deadline < v_now::date then
      raise exception '신청 마감일은 오늘보다 이전으로 설정할 수 없습니다.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_event_beta_fields_trigger on public.events;
create trigger validate_event_beta_fields_trigger
before insert or update on public.events
for each row
execute function public.validate_event_beta_fields();
