-- Final Closed Beta integrity guards.

-- A gym with published/cancelled/ended event history must not be directly deleted.
-- Draft-only gyms may still be removed; account deletion cascades remain an admin concern.
drop policy if exists "Gym owners can delete own gyms" on public.gyms;
drop policy if exists "Gym owners can delete gyms without published history" on public.gyms;
create policy "Gym owners can delete gyms without published history"
on public.gyms
for delete
to authenticated
using (
  auth.uid() = owner_id
  and not exists (
    select 1
    from public.events e
    where e.gym_id = gyms.id
      and coalesce(e.status, 'active') <> 'draft'
  )
);

-- Public event rows must belong to a public gym. Creators can always inspect their own events.
drop policy if exists "Published events are viewable; creators can view drafts" on public.events;
drop policy if exists "Public gym events are viewable; creators can view own events" on public.events;
create policy "Public gym events are viewable; creators can view own events"
on public.events
for select
to public
using (
  created_by = auth.uid()
  or (
    coalesce(status, 'active') <> 'draft'
    and exists (
      select 1
      from public.gyms g
      where g.id = events.gym_id
        and coalesce(g.is_public, false) = true
    )
  )
);

-- Prevent an operator from lowering capacity below already active applications.
create or replace function public.validate_event_capacity_limit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_active_count integer;
begin
  if new.max_participants is not distinct from old.max_participants then
    return new;
  end if;

  if new.max_participants is null or new.max_participants <= 0 then
    return new;
  end if;

  select count(*)::integer
    into v_active_count
  from public.registrations r
  where r.event_id = new.id
    and r.status in ('pending', 'approved');

  if v_active_count > new.max_participants then
    raise exception '현재 신청 인원보다 정원을 적게 설정할 수 없습니다. 현재 신청 인원: %명', v_active_count;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_event_capacity_limit_trigger on public.events;
create trigger validate_event_capacity_limit_trigger
before update of max_participants on public.events
for each row
execute function public.validate_event_capacity_limit();

-- Notify active applicants when an active event's core schedule/location changes.
create or replace function public.notify_participants_on_event_update()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if coalesce(old.status, 'active') = 'active'
     and coalesce(new.status, 'active') = 'active'
     and (
       old.title is distinct from new.title
       or old.event_date is distinct from new.event_date
       or old.event_time is distinct from new.event_time
       or old.address is distinct from new.address
       or old.region is distinct from new.region
     ) then
    insert into public.notifications (user_id, type, title, body, link)
    select distinct
      r.user_id,
      'event_announcement',
      '이벤트 정보가 변경되었습니다',
      new.title || ' 일정 또는 장소 정보가 변경되었습니다. 최신 내용을 확인해주세요.',
      '/events/' || new.id::text
    from public.registrations r
    where r.event_id = new.id
      and r.status in ('pending', 'approved');
  end if;

  return new;
end;
$$;

drop trigger if exists notify_participants_on_event_update_trigger on public.events;
create trigger notify_participants_on_event_update_trigger
after update on public.events
for each row
execute function public.notify_participants_on_event_update();
