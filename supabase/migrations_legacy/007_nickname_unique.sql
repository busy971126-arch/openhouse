-- Unique nicknames + public availability check for signup

create unique index if not exists idx_profiles_nickname_unique
  on public.profiles (lower(trim(nickname)))
  where nickname is not null and trim(nickname) <> '';

create or replace function public.is_nickname_available(p_nickname text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  normalized text;
begin
  normalized := lower(trim(p_nickname));

  if normalized = ''
    or char_length(normalized) < 2
    or char_length(normalized) > 20
  then
    return false;
  end if;

  return not exists (
    select 1
    from public.profiles
    where lower(trim(nickname)) = normalized
  );
end;
$$;

grant execute on function public.is_nickname_available(text) to anon, authenticated;
