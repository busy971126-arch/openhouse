-- 회원가입 트리거 + 필수 컬럼 일괄 보장 (016/017 일부만 적용된 경우)

alter table public.profiles
  add column if not exists gender text,
  add column if not exists age_group text,
  add column if not exists experience text,
  add column if not exists phone text,
  add column if not exists parent_phone text,
  add column if not exists regions text[] default '{}',
  add column if not exists preferred_sports text[] default '{}',
  add column if not exists age integer,
  add column if not exists nickname text,
  add column if not exists weight_class text,
  add column if not exists notify_new_events boolean not null default true;

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
  age_val := case jsonb_typeof(meta -> 'age')
    when 'number' then (meta -> 'age')::text::integer
    when 'string' then nullif(meta ->> 'age', '')::integer
    else null
  end;

  age_group_val := coalesce(
    nullif(meta ->> 'age_group', ''),
    public.age_to_age_group(age_val)
  );

  insert into public.profiles (
    id,
    display_name,
    nickname,
    gender,
    age,
    age_group,
    experience,
    weight_class,
    phone,
    parent_phone,
    regions,
    preferred_sports
  )
  values (
    new.id,
    coalesce(meta ->> 'display_name', split_part(new.email, '@', 1)),
    nullif(meta ->> 'nickname', ''),
    meta ->> 'gender',
    age_val,
    age_group_val,
    meta ->> 'experience',
    nullif(meta ->> 'weight_class', ''),
    nullif(meta ->> 'phone', ''),
    nullif(meta ->> 'parent_phone', ''),
    coalesce(
      array(
        select jsonb_array_elements_text(meta -> 'regions')
        where jsonb_typeof(meta -> 'regions') = 'array'
      ),
      '{}'::text[]
    ),
    coalesce(
      array(
        select jsonb_array_elements_text(meta -> 'preferred_sports')
        where jsonb_typeof(meta -> 'preferred_sports') = 'array'
      ),
      '{}'::text[]
    )
  );
  return new;
exception
  when others then
    raise exception 'profile_create_failed: %', SQLERRM;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
