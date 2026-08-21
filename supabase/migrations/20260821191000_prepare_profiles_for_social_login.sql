create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  provider_name text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
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
    coalesce(
      nullif(meta ->> 'display_name', ''),
      nullif(meta ->> 'full_name', ''),
      nullif(meta ->> 'name', ''),
      case when new.email is not null then split_part(new.email, '@', 1) else null end
    ),
    case
      when provider_name = 'email' then nullif(meta ->> 'nickname', '')
      else null
    end,
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
$function$;
