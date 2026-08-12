-- OpenHouse MVP Schema

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Gyms
create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  region text not null,
  address text,
  created_at timestamptz not null default now()
);

create index idx_gyms_owner on public.gyms (owner_id);

-- Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  sport text not null,
  region text not null,
  event_date date not null,
  event_time time,
  max_participants integer check (max_participants is null or max_participants > 0),
  created_at timestamptz not null default now()
);

create index idx_events_date on public.events (event_date);
create index idx_events_region on public.events (region);
create index idx_events_sport on public.events (sport);
create index idx_events_gym on public.events (gym_id);

-- Registrations
create type public.registration_status as enum (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.registration_status not null default 'pending',
  created_at timestamptz not null default now()
);

create unique index idx_registrations_active_unique
  on public.registrations (event_id, user_id)
  where status in ('pending', 'approved');

create index idx_registrations_event on public.registrations (event_id);
create index idx_registrations_user on public.registrations (user_id);

-- Announcements
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_announcements_event on public.announcements (event_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is gym owner
create or replace function public.is_gym_owner(gym uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.gyms
    where id = gym and owner_id = auth.uid()
  );
$$;

-- Helper: is event gym owner
create or replace function public.is_event_owner(event uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.events e
    join public.gyms g on g.id = e.gym_id
    where e.id = event and g.owner_id = auth.uid()
  );
$$;

-- Capacity check trigger
create or replace function public.check_event_capacity()
returns trigger
language plpgsql
as $$
declare
  cap integer;
  approved_count integer;
begin
  if new.status not in ('pending', 'approved') then
    return new;
  end if;

  select max_participants into cap from public.events where id = new.event_id;

  if cap is null then
    return new;
  end if;

  select count(*) into approved_count
  from public.registrations
  where event_id = new.event_id
    and status = 'approved'
    and id is distinct from coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if tg_op = 'INSERT' and new.status = 'approved' then
    approved_count := approved_count + 1;
  end if;

  if approved_count >= cap then
    raise exception 'Event is full (max % participants)', cap;
  end if;

  return new;
end;
$$;

create trigger registrations_capacity_check
  before insert or update on public.registrations
  for each row execute function public.check_event_capacity();

-- RLS
alter table public.profiles enable row level security;
alter table public.gyms enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.announcements enable row level security;

-- Profiles policies
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Gyms policies
create policy "Gyms are viewable by everyone"
  on public.gyms for select using (true);

create policy "Authenticated users can create gyms"
  on public.gyms for insert to authenticated with check (auth.uid() = owner_id);

create policy "Gym owners can update own gyms"
  on public.gyms for update to authenticated using (auth.uid() = owner_id);

create policy "Gym owners can delete own gyms"
  on public.gyms for delete to authenticated using (auth.uid() = owner_id);

-- Events policies
create policy "Events are viewable by everyone"
  on public.events for select using (true);

create policy "Gym owners can create events"
  on public.events for insert to authenticated
  with check (public.is_gym_owner(gym_id) and auth.uid() = created_by);

create policy "Gym owners can update own events"
  on public.events for update to authenticated
  using (public.is_gym_owner(gym_id));

create policy "Gym owners can delete own events"
  on public.events for delete to authenticated
  using (public.is_gym_owner(gym_id));

-- Registrations policies
create policy "Users can view own registrations"
  on public.registrations for select to authenticated
  using (auth.uid() = user_id);

create policy "Event owners can view registrations"
  on public.registrations for select to authenticated
  using (public.is_event_owner(event_id));

create policy "Authenticated users can register"
  on public.registrations for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');

create policy "Users can cancel own registration"
  on public.registrations for update to authenticated
  using (auth.uid() = user_id)
  with check (status = 'cancelled');

create policy "Event owners can approve or reject"
  on public.registrations for update to authenticated
  using (public.is_event_owner(event_id))
  with check (status in ('approved', 'rejected'));

-- Announcements policies
create policy "Announcements are viewable by everyone"
  on public.announcements for select using (true);

create policy "Event owners can create announcements"
  on public.announcements for insert to authenticated
  with check (public.is_event_owner(event_id) and auth.uid() = author_id);

create policy "Event owners can update announcements"
  on public.announcements for update to authenticated
  using (public.is_event_owner(event_id));

create policy "Event owners can delete announcements"
  on public.announcements for delete to authenticated
  using (public.is_event_owner(event_id));
