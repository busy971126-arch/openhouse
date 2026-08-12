-- 체육관 담당자 직책 (OpenHouse 호스트 권한과 별개)
alter table public.gyms
  add column if not exists representative_role text,
  add column if not exists representative_role_custom text;
