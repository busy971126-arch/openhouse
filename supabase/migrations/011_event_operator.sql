-- Event manual recruitment control + participant memo

alter table public.events
  add column if not exists recruitment_closed boolean not null default false;

alter table public.registrations
  add column if not exists operator_memo text;

-- Event owners: approve, reject, cancel, revert to pending
drop policy if exists "Event owners can approve or reject" on public.registrations;

create policy "Event owners can manage registrations"
  on public.registrations for update to authenticated
  using (public.is_event_owner(event_id))
  with check (status in ('approved', 'rejected', 'cancelled', 'pending'));
