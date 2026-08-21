-- Return a clear error for direct owner deletes while preserving account deletion/admin cascades.
drop policy if exists "Gym owners can delete gyms without published history" on public.gyms;
drop policy if exists "Gym owners can delete own gyms" on public.gyms;
create policy "Gym owners can delete own gyms"
on public.gyms
for delete
to authenticated
using (auth.uid() = owner_id);

create or replace function public.guard_gym_delete_history()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is not null and exists (
    select 1
    from public.events e
    where e.gym_id = old.id
      and coalesce(e.status, 'active') <> 'draft'
  ) then
    raise exception '공개·취소·종료 이벤트 기록이 있는 체육관은 삭제할 수 없습니다. 체육관을 비공개로 전환해주세요.';
  end if;

  return old;
end;
$$;

drop trigger if exists guard_gym_delete_history_trigger on public.gyms;
create trigger guard_gym_delete_history_trigger
before delete on public.gyms
for each row
execute function public.guard_gym_delete_history();
