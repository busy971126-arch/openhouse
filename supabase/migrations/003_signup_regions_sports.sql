-- Signup profile: region, sports, optional phone

alter table public.profiles
  add column if not exists phone text,
  add column if not exists regions text[] default '{}',
  add column if not exists preferred_sports text[] default '{}';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
begin
  insert into public.profiles (
    id,
    display_name,
    gender,
    age_group,
    experience,
    phone,
    regions,
    preferred_sports
  )
  values (
    new.id,
    coalesce(meta ->> 'display_name', split_part(new.email, '@', 1)),
    meta ->> 'gender',
    meta ->> 'age_group',
    meta ->> 'experience',
    nullif(meta ->> 'phone', ''),
    coalesce(
      array(select jsonb_array_elements_text(meta -> 'regions')),
      '{}'::text[]
    ),
    coalesce(
      array(select jsonb_array_elements_text(meta -> 'preferred_sports')),
      '{}'::text[]
    )
  );
  return new;
end;
$$;
