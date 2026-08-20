-- Add profile fields for participant info (signup)

alter table public.profiles
  add column if not exists gender text,
  add column if not exists age_group text,
  add column if not exists experience text;

-- Update trigger to copy signup metadata into profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, gender, age_group, experience)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'gender',
    new.raw_user_meta_data ->> 'age_group',
    new.raw_user_meta_data ->> 'experience'
  );
  return new;
end;
$$;
