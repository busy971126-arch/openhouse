-- Profile social: friendships + workout photo feed

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self check (requester_id <> addressee_id),
  constraint friendships_unique_pair unique (requester_id, addressee_id)
);

create index if not exists idx_friendships_requester
  on public.friendships (requester_id, status);
create index if not exists idx_friendships_addressee
  on public.friendships (addressee_id, status);

alter table public.friendships enable row level security;

drop policy if exists "Users can view own friendships" on public.friendships;
create policy "Users can view own friendships"
  on public.friendships for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "Users can send friend requests" on public.friendships;
create policy "Users can send friend requests"
  on public.friendships for insert to authenticated
  with check (auth.uid() = requester_id and status = 'pending');

drop policy if exists "Users can respond to friend requests" on public.friendships;
create policy "Users can respond to friend requests"
  on public.friendships for update to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "Users can delete own friendships" on public.friendships;
create policy "Users can delete own friendships"
  on public.friendships for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create table if not exists public.profile_feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_type text not null default 'photo'
    check (post_type in ('photo')),
  caption text,
  event_id uuid references public.events (id) on delete set null,
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_profile_feed_posts_user
  on public.profile_feed_posts (user_id, created_at desc);

alter table public.profile_feed_posts enable row level security;

drop policy if exists "Authenticated users can read feed posts" on public.profile_feed_posts;
create policy "Authenticated users can read feed posts"
  on public.profile_feed_posts for select to authenticated
  using (true);

drop policy if exists "Users can insert own feed posts" on public.profile_feed_posts;
create policy "Users can insert own feed posts"
  on public.profile_feed_posts for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own feed posts" on public.profile_feed_posts;
create policy "Users can delete own feed posts"
  on public.profile_feed_posts for delete to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('profile-feed-photos', 'profile-feed-photos', true)
on conflict (id) do nothing;

drop policy if exists "Profile feed photos are publicly readable" on storage.objects;
create policy "Profile feed photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'profile-feed-photos');

drop policy if exists "Users can upload own profile feed photos" on storage.objects;
create policy "Users can upload own profile feed photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-feed-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own profile feed photos" on storage.objects;
create policy "Users can delete own profile feed photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-feed-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
