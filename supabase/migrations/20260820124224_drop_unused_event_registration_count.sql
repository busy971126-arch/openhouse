-- Drop unused singular public count RPC.
-- Does not change get_event_registration_counts or is_nickname_available.

drop function if exists public.get_event_registration_count(uuid);
