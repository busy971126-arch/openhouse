alter table public.profiles
  add column if not exists initial_use_intent text,
  add column if not exists initial_use_intent_selected_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_initial_use_intent_check;

alter table public.profiles
  add constraint profiles_initial_use_intent_check
  check (initial_use_intent is null or initial_use_intent in ('participant', 'operator'));

comment on column public.profiles.initial_use_intent is
  'One-time onboarding preference only; not an authorization role.';
comment on column public.profiles.initial_use_intent_selected_at is
  'Timestamp when the initial use intent onboarding was completed.';
