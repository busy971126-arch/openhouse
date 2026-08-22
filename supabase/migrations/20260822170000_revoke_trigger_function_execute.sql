-- S2: revoke PostgREST execute on trigger-only SECURITY DEFINER helpers.
-- Live proacl snapshot 2026-08-22 (identical for all 12):
--   {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
-- Does not replace function bodies, triggers, or search_path.
-- Does not touch postgres or service_role grants.

revoke execute on function public.guard_event_admin_moderation() from public, anon, authenticated;
revoke execute on function public.guard_gym_delete_history() from public, anon, authenticated;
revoke execute on function public.guard_inquiry_admin_update() from public, anon, authenticated;
revoke execute on function public.guard_registration_update_fields() from public, anon, authenticated;
revoke execute on function public.guard_report_admin_update() from public, anon, authenticated;
revoke execute on function public.handle_event_cancellation() from public, anon, authenticated;
revoke execute on function public.log_admin_inquiry_update() from public, anon, authenticated;
revoke execute on function public.log_admin_report_update() from public, anon, authenticated;
revoke execute on function public.log_operational_event() from public, anon, authenticated;
revoke execute on function public.log_operational_registration() from public, anon, authenticated;
revoke execute on function public.notify_participants_on_event_update() from public, anon, authenticated;
revoke execute on function public.validate_event_capacity_limit() from public, anon, authenticated;
