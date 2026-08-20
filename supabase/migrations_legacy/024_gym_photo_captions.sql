-- Optional gym photos: [{ url, caption }, ...] (caption describes facilities shown)
-- PostgreSQL USING 절에서는 서브쿼리를 쓸 수 없어 변환 함수를 사용합니다.

create or replace function public.migrate_gym_photo_urls(urls text[])
returns jsonb
language sql
immutable
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('url', photo_url, 'caption', '')),
    '[]'::jsonb
  )
  from unnest(coalesce(urls, '{}')) as photo_url
  where photo_url is not null and photo_url <> ''
$$;

alter table public.gyms
  alter column mat_photos drop default,
  alter column facility_photos drop default,
  alter column exterior_photos drop default,
  alter column parking_photos drop default;

alter table public.gyms
  alter column mat_photos type jsonb using public.migrate_gym_photo_urls(mat_photos::text[]),
  alter column facility_photos type jsonb using public.migrate_gym_photo_urls(facility_photos::text[]),
  alter column exterior_photos type jsonb using public.migrate_gym_photo_urls(exterior_photos::text[]),
  alter column parking_photos type jsonb using public.migrate_gym_photo_urls(parking_photos::text[]);

alter table public.gyms
  alter column mat_photos set default '[]'::jsonb,
  alter column facility_photos set default '[]'::jsonb,
  alter column exterior_photos set default '[]'::jsonb,
  alter column parking_photos set default '[]'::jsonb;

alter table public.gyms
  alter column mat_photos set not null,
  alter column facility_photos set not null,
  alter column exterior_photos set not null,
  alter column parking_photos set not null;

drop function public.migrate_gym_photo_urls(text[]);
