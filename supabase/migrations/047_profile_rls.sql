-- Tighten profiles RLS: own row + host registrants + friends.
-- Sensitive reads (public profile, search, visibility map, pending gym) via security definer RPCs.

-- 033 prerequisite (safe if already applied)
alter table public.profiles
  add column if not exists pending_gym_info jsonb;

comment on column public.profiles.pending_gym_info is
  'Temporary gym draft when operator signup completes before session (email confirm). Cleared after gym insert.';

drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Event hosts can view registrant profiles"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1
      from public.registrations r
      join public.events e on e.id = r.event_id
      join public.gyms g on g.id = e.gym_id
      where r.user_id = profiles.id
        and g.owner_id = auth.uid()
    )
  );

create policy "Friends can view accepted friend profiles"
  on public.profiles for select to authenticated
  using (
    exists (
      select 1
      from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = profiles.id)
          or (f.addressee_id = auth.uid() and f.requester_id = profiles.id)
        )
    )
  );

revoke select (pending_gym_info) on public.profiles from authenticated;

create or replace function public.get_my_pending_gym_info()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select p.pending_gym_info
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.get_public_profile(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id,
    'display_name', p.display_name,
    'nickname', p.nickname,
    'gender', p.gender,
    'experience', p.experience,
    'weight_class', p.weight_class,
    'regions', p.regions,
    'preferred_sports', p.preferred_sports,
    'photo_url', p.photo_url,
    'bio', p.bio,
    'created_at', p.created_at,
    'visibility_settings', p.visibility_settings
  )
  from public.profiles p
  where p.id = p_user_id
    and auth.uid() is not null;
$$;

create or replace function public.search_profiles(p_query text, p_limit integer default 10)
returns table (
  id uuid,
  nickname text,
  display_name text,
  preferred_sports text[],
  photo_url text,
  weight_class text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.nickname,
    p.display_name,
    p.preferred_sports,
    p.photo_url,
    p.weight_class
  from public.profiles p
  where auth.uid() is not null
    and p.id <> auth.uid()
    and length(trim(coalesce(p_query, ''))) >= 2
    and (
      p.nickname ilike '%' || trim(p_query) || '%'
      or p.display_name ilike '%' || trim(p_query) || '%'
    )
  order by p.nickname nulls last, p.display_name nulls last
  limit greatest(1, least(coalesce(p_limit, 10), 20));
$$;

create or replace function public.get_profile_visibility_settings(p_user_ids uuid[])
returns table (
  id uuid,
  visibility_settings jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.visibility_settings
  from public.profiles p
  where auth.uid() is not null
    and p.id = any(p_user_ids);
$$;

grant execute on function public.get_my_pending_gym_info() to authenticated;
grant execute on function public.get_public_profile(uuid) to authenticated;
grant execute on function public.search_profiles(text, integer) to authenticated;
grant execute on function public.get_profile_visibility_settings(uuid[]) to authenticated;

notify pgrst, 'reload schema';
