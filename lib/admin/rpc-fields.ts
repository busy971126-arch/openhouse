export const ADMIN_OVERVIEW_FIELDS = [
  "new_users_today",
  "applications_today",
  "events_published_today",
  "active_events_today",
  "pending_application_count",
  "open_inquiry_count",
  "open_report_count",
  "draft_event_count",
  "events_next_7_days",
  "active_application_count",
] as const;

export const ADMIN_USER_FIELDS = [
  "id",
  "nickname",
  "display_name",
  "created_at",
  "is_operator",
  "application_count",
] as const;

export const ADMIN_GYM_FIELDS = [
  "id",
  "name",
  "sport",
  "region",
  "is_public",
  "created_at",
  "owner_label",
  "upcoming_event_count",
] as const;

export const ADMIN_EVENT_FIELDS = [
  "id",
  "title",
  "event_date",
  "status",
  "gym_name",
  "host_label",
  "application_count",
  "is_hidden",
  "is_paused",
] as const;

export const ADMIN_EVENT_DETAIL_FIELDS = [
  "id",
  "title",
  "sport",
  "event_type",
  "event_date",
  "event_time",
  "status",
  "region",
  "address",
  "gym_id",
  "gym_name",
  "gym_is_public",
  "host_label",
  "max_participants",
  "active_application_count",
  "created_at",
  "description",
  "is_publicly_viewable",
  "admin_hidden_at",
  "admin_recruitment_paused_at",
  "last_moderation_reason",
] as const;

export const ADMIN_APPLICATION_FIELDS = [
  "id",
  "created_at",
  "status",
  "participant_label",
  "event_id",
  "event_title",
  "event_date",
  "gym_name",
] as const;

export const ADMIN_APPLICATION_DETAIL_FIELDS = [
  "id",
  "created_at",
  "status",
  "participant_id",
  "participant_label",
  "event_id",
  "event_title",
  "event_date",
  "gym_id",
  "gym_name",
  "host_label",
] as const;

export const ADMIN_ACTIVITY_FIELDS = [
  "id",
  "occurred_at",
  "actor_type",
  "action",
  "target_type",
  "target_id",
  "event_id",
] as const;

export const ADMIN_FORBIDDEN_FIELDS = [
  "phone",
  "parent_phone",
  "pending_gym_info",
  "emergency_contact",
  "applicant_notes",
  "operator_memo",
] as const;

export function pickRpcFields<T extends readonly string[]>(
  row: Record<string, unknown>,
  fields: T,
): Pick<Record<string, unknown>, T[number]> {
  const picked: Record<string, unknown> = {};
  for (const field of fields) {
    picked[field] = row[field];
  }
  return picked as Pick<Record<string, unknown>, T[number]>;
}

export function rpcRowHasForbiddenFields(row: Record<string, unknown>): boolean {
  return ADMIN_FORBIDDEN_FIELDS.some((field) => field in row);
}
