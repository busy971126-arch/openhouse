-- ERD V1.0 MVP completion: reports, inquiries, event interests, QA constraints

-- ---------------------------------------------------------------------------
-- Event lifecycle status (ERD: active / cancelled)
-- ---------------------------------------------------------------------------
alter table public.events
  add column if not exists status text not null default 'active'
    check (status in ('active', 'cancelled'));

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_user_id uuid references public.profiles (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  category text not null check (
    category in ('no_show', 'abuse', 'misinformation', 'inappropriate', 'other')
  ),
  description text not null,
  status text not null default 'received'
    check (status in ('received', 'reviewing', 'resolved')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint reports_target_required check (
    reported_user_id is not null or event_id is not null
  )
);

create index if not exists idx_reports_reporter
  on public.reports (reporter_id, created_at desc);
create index if not exists idx_reports_status
  on public.reports (status, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "Users can view own reports" on public.reports;
create policy "Users can view own reports"
  on public.reports for select to authenticated
  using (auth.uid() = reporter_id);

drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports"
  on public.reports for insert to authenticated
  with check (auth.uid() = reporter_id and status = 'received');

-- ---------------------------------------------------------------------------
-- Inquiries
-- ---------------------------------------------------------------------------
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'answered', 'closed')),
  admin_reply text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inquiries_user
  on public.inquiries (user_id, created_at desc);

alter table public.inquiries enable row level security;

drop policy if exists "Users can view own inquiries" on public.inquiries;
create policy "Users can view own inquiries"
  on public.inquiries for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create inquiries" on public.inquiries;
create policy "Users can create inquiries"
  on public.inquiries for insert to authenticated
  with check (auth.uid() = user_id and status = 'open');

-- ---------------------------------------------------------------------------
-- Event interests (ERD: EventInterest)
-- ---------------------------------------------------------------------------
create table if not exists public.event_interests (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create index if not exists idx_event_interests_event
  on public.event_interests (event_id);

alter table public.event_interests enable row level security;

drop policy if exists "Users can view own event interests" on public.event_interests;
create policy "Users can view own event interests"
  on public.event_interests for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can add event interests" on public.event_interests;
create policy "Users can add event interests"
  on public.event_interests for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove event interests" on public.event_interests;
create policy "Users can remove event interests"
  on public.event_interests for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Friendship: bidirectional duplicate prevention
-- ---------------------------------------------------------------------------
-- Normalize existing reverse duplicates (keep older row)
delete from public.friendships f1
using public.friendships f2
where f1.requester_id = f2.addressee_id
  and f1.addressee_id = f2.requester_id
  and f1.id > f2.id;

alter table public.friendships
  drop constraint if exists friendships_unique_pair;

create unique index if not exists idx_friendships_pair_unique
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

-- ---------------------------------------------------------------------------
-- Capacity race: lock event row + count approved on approval
-- ---------------------------------------------------------------------------
create or replace function public.check_event_capacity()
returns trigger
language plpgsql
as $$
declare
  cap integer;
  approved_count integer;
  becoming_approved boolean;
begin
  becoming_approved := new.status = 'approved'
    and (tg_op = 'INSERT' or coalesce(old.status, '') <> 'approved');

  if not becoming_approved then
    return new;
  end if;

  select e.max_participants
  into cap
  from public.events e
  where e.id = new.event_id
  for update;

  if cap is null then
    return new;
  end if;

  select count(*)
  into approved_count
  from public.registrations r
  where r.event_id = new.event_id
    and r.status = 'approved'
    and r.id is distinct from coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if approved_count >= cap then
    raise exception 'Event is full (max % participants)', cap;
  end if;

  return new;
end;
$$;

create or replace function public.update_registration_status(
  p_registration_id uuid,
  p_status public.registration_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_registration public.registrations%rowtype;
begin
  if v_user is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  select *
  into v_registration
  from public.registrations
  where id = p_registration_id
  for update;

  if not found then
    raise exception 'REGISTRATION_NOT_FOUND';
  end if;

  if p_status in ('approved', 'rejected') then
    if not public.is_event_owner(v_registration.event_id) then
      raise exception 'NOT_EVENT_OWNER';
    end if;

    if v_registration.status <> 'pending' then
      raise exception 'INVALID_STATUS_TRANSITION';
    end if;
  elsif p_status = 'cancelled' then
    -- Allow: registrant, party representative, or gym owner of the event
    -- (is_event_owner = caller owns the gym that hosts this event)
    if not (
      v_registration.user_id = v_user
      or (
        v_registration.party_representative_user_id = v_user
        and v_registration.party_id is not null
      )
      or public.is_event_owner(v_registration.event_id)
    ) then
      raise exception 'NOT_ALLOWED';
    end if;
  elsif p_status = 'pending' then
    if not public.is_event_owner(v_registration.event_id) then
      raise exception 'NOT_EVENT_OWNER';
    end if;
  else
    raise exception 'INVALID_STATUS';
  end if;

  update public.registrations
  set status = p_status
  where id = p_registration_id;
end;
$$;

grant execute on function public.update_registration_status(uuid, public.registration_status)
  to authenticated;
