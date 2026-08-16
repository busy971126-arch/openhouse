-- Profile field visibility settings (public / friends / private)

alter table public.profiles
  add column if not exists visibility_settings jsonb not null default '{
    "weight_class": "public",
    "experience": "public",
    "gym_affiliation": "public",
    "regions": "public",
    "bio": "public",
    "phone": "private",
    "parent_phone": "private",
    "preferred_sports": "public"
  }'::jsonb;

update public.profiles
set visibility_settings = '{
  "weight_class": "public",
  "experience": "public",
  "gym_affiliation": "public",
  "regions": "public",
  "bio": "public",
  "phone": "private",
  "parent_phone": "private",
  "preferred_sports": "public"
}'::jsonb
where visibility_settings is null;
