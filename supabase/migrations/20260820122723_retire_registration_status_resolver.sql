-- Retire unused broken resolver that reads missing events.auto_approve.
-- Does not add schema columns or change registration insert logic.

drop function if exists public.resolve_new_registration_status(uuid);
