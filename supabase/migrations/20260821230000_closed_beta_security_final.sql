-- Final Closed Beta security hardening.

-- Announcement visibility follows the event/gym visibility boundary.
drop policy if exists "Announcements are viewable by everyone" on public.announcements;
drop policy if exists "Public event announcements are viewable; owners can view own" on public.announcements;
create policy "Public event announcements are viewable; owners can view own"
on public.announcements
for select
to public
using (
  public.is_event_owner(event_id)
  or exists (
    select 1
    from public.events e
    join public.gyms g on g.id = e.gym_id
    where e.id = announcements.event_id
      and coalesce(e.status, 'active') <> 'draft'
      and coalesce(g.is_public, false) = true
  )
);

-- Registration snapshots are immutable except for explicit lifecycle/operator fields.
-- Participants (including a legacy party representative) may only change status to cancelled.
-- Event owners may change status/operator memo/cancel provenance, but not applicant identity or application data.
create or replace function public.guard_registration_update_fields()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user uuid := auth.uid();
  v_is_owner boolean := false;
  v_is_participant boolean := false;
begin
  if v_user is null then
    return new;
  end if;

  v_is_owner := public.is_event_owner(old.event_id);
  v_is_participant :=
    old.user_id = v_user
    or (
      old.party_id is not null
      and old.party_representative_user_id = v_user
    );

  if v_is_owner then
    if (
      to_jsonb(new) - array['status','operator_memo','cancelled_by_event']::text[]
      is distinct from
      to_jsonb(old) - array['status','operator_memo','cancelled_by_event']::text[]
    ) then
      raise exception '참가자의 신청 원본 정보는 운영자가 수정할 수 없습니다.';
    end if;
    return new;
  end if;

  if v_is_participant then
    if new.status <> 'cancelled'::public.registration_status then
      raise exception '참가자는 자신의 신청을 취소만 할 수 있습니다.';
    end if;

    if (
      to_jsonb(new) - 'status'
      is distinct from
      to_jsonb(old) - 'status'
    ) then
      raise exception '참가 신청 정보는 신청 후 직접 변경할 수 없습니다.';
    end if;
    return new;
  end if;

  raise exception '참가 신청을 수정할 권한이 없습니다.';
end;
$$;

drop trigger if exists guard_registration_update_fields_trigger on public.registrations;
create trigger guard_registration_update_fields_trigger
before update on public.registrations
for each row
execute function public.guard_registration_update_fields();
