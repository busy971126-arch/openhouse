-- Restrict login-only SECURITY DEFINER RPCs: no anon/PUBLIC execute.
-- Does not replace function bodies or change SECURITY DEFINER.

revoke all on function public.create_party_registration(uuid, text, text, text, text, boolean, uuid[]) from public;
revoke all on function public.create_party_registration(uuid, text, text, text, text, boolean, uuid[]) from anon;
grant execute on function public.create_party_registration(uuid, text, text, text, text, boolean, uuid[]) to authenticated;
grant execute on function public.create_party_registration(uuid, text, text, text, text, boolean, uuid[]) to service_role;

revoke all on function public.create_solo_registration(uuid, text, text, text, text, boolean) from public;
revoke all on function public.create_solo_registration(uuid, text, text, text, text, boolean) from anon;
grant execute on function public.create_solo_registration(uuid, text, text, text, text, boolean) to authenticated;
grant execute on function public.create_solo_registration(uuid, text, text, text, text, boolean) to service_role;

revoke all on function public.get_my_pending_gym_info() from public;
revoke all on function public.get_my_pending_gym_info() from anon;
grant execute on function public.get_my_pending_gym_info() to authenticated;
grant execute on function public.get_my_pending_gym_info() to service_role;

revoke all on function public.get_profile_visibility_settings(uuid[]) from public;
revoke all on function public.get_profile_visibility_settings(uuid[]) from anon;
grant execute on function public.get_profile_visibility_settings(uuid[]) to authenticated;
grant execute on function public.get_profile_visibility_settings(uuid[]) to service_role;

revoke all on function public.get_public_profile(uuid) from public;
revoke all on function public.get_public_profile(uuid) from anon;
grant execute on function public.get_public_profile(uuid) to authenticated;
grant execute on function public.get_public_profile(uuid) to service_role;

revoke all on function public.is_event_owner(uuid) from public;
revoke all on function public.is_event_owner(uuid) from anon;
grant execute on function public.is_event_owner(uuid) to authenticated;
grant execute on function public.is_event_owner(uuid) to service_role;

revoke all on function public.is_gym_owner(uuid) from public;
revoke all on function public.is_gym_owner(uuid) from anon;
grant execute on function public.is_gym_owner(uuid) to authenticated;
grant execute on function public.is_gym_owner(uuid) to service_role;

revoke all on function public.search_profiles(text, integer) from public;
revoke all on function public.search_profiles(text, integer) from anon;
grant execute on function public.search_profiles(text, integer) to authenticated;
grant execute on function public.search_profiles(text, integer) to service_role;

revoke all on function public.update_registration_status(uuid, public.registration_status) from public;
revoke all on function public.update_registration_status(uuid, public.registration_status) from anon;
grant execute on function public.update_registration_status(uuid, public.registration_status) to authenticated;
grant execute on function public.update_registration_status(uuid, public.registration_status) to service_role;

revoke all on function public.user_party_ids() from public;
revoke all on function public.user_party_ids() from anon;
grant execute on function public.user_party_ids() to authenticated;
grant execute on function public.user_party_ids() to service_role;
