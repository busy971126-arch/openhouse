-- Add numeric age for signup; age_group is derived for host display

alter table public.profiles
  add column if not exists age integer;

create or replace function public.age_to_age_group(age_val integer)
returns text
language sql
immutable
as $$
  select case
    when age_val between 10 and 19 then '10대'
    when age_val between 20 and 29 then '20대'
    when age_val between 30 and 39 then '30대'
    when age_val >= 40 then '30+'
    else null
  end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  age_val integer;
  age_group_val text;
begin
  age_val := nullif(meta ->> 'age', '')::integer;
  age_group_val := coalesce(
    nullif(meta ->> 'age_group', ''),
    public.age_to_age_group(age_val)
  );

  insert into public.profiles (
    id,
    display_name,
    gender,
    age,
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
    age_val,
    age_group_val,
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
