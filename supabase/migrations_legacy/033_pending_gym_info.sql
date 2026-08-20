-- Deferred gym registration after email-confirmation signup (gym operators)

alter table public.profiles
  add column if not exists pending_gym_info jsonb;

comment on column public.profiles.pending_gym_info is
  'Temporary gym draft when operator signup completes before session (email confirm). Cleared after gym insert.';
