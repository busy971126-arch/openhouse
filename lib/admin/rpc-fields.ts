export const ADMIN_OVERVIEW_FIELDS = [
  "user_count",
  "gym_count",
  "public_event_count",
  "draft_event_count",
  "active_application_count",
  "open_inquiry_count",
  "open_report_count",
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
