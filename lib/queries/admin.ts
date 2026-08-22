import { sanitizeAdminSearch, type EventAdminStatus } from "@/lib/utils/admin";
import {
  ADMIN_EVENT_DETAIL_FIELDS,
  ADMIN_EVENT_FIELDS,
  ADMIN_GYM_FIELDS,
  ADMIN_OVERVIEW_FIELDS,
  ADMIN_USER_FIELDS,
  pickRpcFields,
} from "@/lib/admin/rpc-fields";
import type { createClient } from "@/lib/supabase/server";

type AdminClient = Awaited<ReturnType<typeof createClient>>;

export type AdminOverview = {
  userCount: number;
  gymCount: number;
  publicEventCount: number;
  draftEventCount: number;
  activeApplicationCount: number;
  openInquiryCount: number;
  openReportCount: number;
};

export type AdminActionLogItem = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
};

export type AdminInquiryListItem = {
  id: string;
  category: string;
  message: string;
  status: string;
  createdAt: string;
  userLabel: string;
};

export type AdminInquiryDetail = AdminInquiryListItem & {
  userId: string;
  adminReply: string | null;
};

export type AdminReportListItem = {
  id: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  reporterLabel: string;
  reportedUserLabel: string | null;
  eventTitle: string | null;
  eventId: string | null;
};

export type AdminReportDetail = AdminReportListItem & {
  reporterId: string;
  reportedUserId: string | null;
  adminNote: string | null;
  resolvedAt: string | null;
};

export type AdminGymListItem = {
  id: string;
  name: string;
  sport: string;
  region: string;
  isPublic: boolean;
  createdAt: string;
  ownerLabel: string;
  upcomingEventCount: number;
};

export type AdminEventListItem = {
  id: string;
  title: string;
  eventDate: string;
  status: string;
  gymName: string;
  hostLabel: string;
  applicationCount: number;
};

export type AdminEventDetail = {
  id: string;
  title: string;
  sport: string;
  eventType: string;
  eventDate: string;
  eventTime: string | null;
  status: string;
  region: string;
  address: string | null;
  gymId: string;
  gymName: string;
  gymIsPublic: boolean;
  hostLabel: string;
  maxParticipants: number | null;
  activeApplicationCount: number;
  createdAt: string;
  description: string | null;
  isPubliclyViewable: boolean;
};

export type AdminUserListItem = {
  id: string;
  nickname: string | null;
  displayName: string | null;
  createdAt: string;
  isOperator: boolean;
  applicationCount: number;
};

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return 0;
}

function profileLabel(profile: {
  nickname?: string | null;
  display_name?: string | null;
} | null): string {
  return profile?.nickname?.trim() || profile?.display_name?.trim() || "이름 없음";
}

async function getProfileLabelMap(
  supabase: AdminClient,
  userIds: string[],
): Promise<Map<string, { nickname: string | null; display_name: string | null }>> {
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase.rpc("admin_get_profile_labels", {
    user_ids: userIds,
  });

  if (error) {
    console.error("admin_get_profile_labels:", error.message);
    return new Map();
  }

  return new Map(
    ((data ?? []) as Array<{
      id: string;
      nickname: string | null;
      display_name: string | null;
    }>).map((row) => [row.id, row]),
  );
}

export async function getAdminOverview(
  supabase: AdminClient,
): Promise<AdminOverview> {
  const { data, error } = await supabase.rpc("admin_get_overview");
  if (error) {
    console.error("admin_get_overview:", error.message);
    return {
      userCount: 0,
      gymCount: 0,
      publicEventCount: 0,
      draftEventCount: 0,
      activeApplicationCount: 0,
      openInquiryCount: 0,
      openReportCount: 0,
    };
  }

  const row = pickRpcFields(
    ((Array.isArray(data) ? data[0] : data) ?? {}) as Record<string, unknown>,
    ADMIN_OVERVIEW_FIELDS,
  );

  return {
    userCount: asNumber(row.user_count),
    gymCount: asNumber(row.gym_count),
    publicEventCount: asNumber(row.public_event_count),
    draftEventCount: asNumber(row.draft_event_count),
    activeApplicationCount: asNumber(row.active_application_count),
    openInquiryCount: asNumber(row.open_inquiry_count),
    openReportCount: asNumber(row.open_report_count),
  };
}

export async function getAdminRecentActivity(
  supabase: AdminClient,
): Promise<AdminActionLogItem[]> {
  const { data, error } = await supabase
    .from("admin_action_logs")
    .select("id, action, target_type, target_id, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("admin action logs:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    createdAt: row.created_at,
  }));
}

export async function getAdminInquiries(
  supabase: AdminClient,
): Promise<AdminInquiryListItem[]> {
  const { data, error } = await supabase
    .from("inquiries")
    .select("id, user_id, category, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("admin inquiries:", error.message);
    return [];
  }

  const rows = data ?? [];
  const profileMap = await getProfileLabelMap(
    supabase,
    [...new Set(rows.map((row) => row.user_id))],
  );

  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    userLabel: profileLabel(profileMap.get(row.user_id) ?? null),
  }));
}

export async function getAdminInquiry(
  supabase: AdminClient,
  id: string,
): Promise<AdminInquiryDetail | null> {
  const { data, error } = await supabase
    .from("inquiries")
    .select("id, user_id, category, message, status, admin_reply, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const profileMap = await getProfileLabelMap(supabase, [data.user_id]);

  return {
    id: data.id,
    userId: data.user_id,
    category: data.category,
    message: data.message,
    status: data.status,
    adminReply: data.admin_reply,
    createdAt: data.created_at,
    userLabel: profileLabel(profileMap.get(data.user_id) ?? null),
  };
}

export async function getAdminReports(
  supabase: AdminClient,
): Promise<AdminReportListItem[]> {
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, category, description, status, created_at, event_id, reporter_id, reported_user_id",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("admin reports:", error.message);
    return [];
  }

  const rows = data ?? [];
  const userIds = [
    ...new Set(
      rows.flatMap((row) =>
        [row.reporter_id, row.reported_user_id].filter(Boolean) as string[],
      ),
    ),
  ];
  const eventIds = [
    ...new Set(rows.map((row) => row.event_id).filter(Boolean) as string[]),
  ];

  const [profileMap, eventMap] = await Promise.all([
    getProfileLabelMap(supabase, userIds),
    getEventTitleMap(supabase, eventIds),
  ]);

  return rows.map((row) => ({
    id: row.id,
    category: row.category,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    reporterLabel: profileLabel(profileMap.get(row.reporter_id) ?? null),
    reportedUserLabel: row.reported_user_id
      ? profileLabel(profileMap.get(row.reported_user_id) ?? null)
      : null,
    eventTitle: row.event_id ? eventMap.get(row.event_id) ?? null : null,
    eventId: row.event_id,
  }));
}

async function getEventTitleMap(
  supabase: AdminClient,
  eventIds: string[],
): Promise<Map<string, string>> {
  if (eventIds.length === 0) return new Map();

  const { data, error } = await supabase.rpc("admin_get_event_titles", {
    event_ids: eventIds,
  });

  if (error) {
    console.error("admin_get_event_titles:", error.message);
    return new Map();
  }

  return new Map(
    ((data ?? []) as Array<{ id: string; title: string }>).map((row) => [
      row.id,
      row.title,
    ]),
  );
}

export async function getAdminReport(
  supabase: AdminClient,
  id: string,
): Promise<AdminReportDetail | null> {
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, category, description, status, created_at, event_id, reporter_id, reported_user_id, admin_note, resolved_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const userIds = [data.reporter_id, data.reported_user_id].filter(
    Boolean,
  ) as string[];
  const [profileMap, eventMap] = await Promise.all([
    getProfileLabelMap(supabase, userIds),
    getEventTitleMap(supabase, data.event_id ? [data.event_id] : []),
  ]);

  return {
    id: data.id,
    category: data.category,
    description: data.description,
    status: data.status,
    createdAt: data.created_at,
    reporterId: data.reporter_id,
    reportedUserId: data.reported_user_id,
    adminNote: data.admin_note,
    resolvedAt: data.resolved_at,
    reporterLabel: profileLabel(profileMap.get(data.reporter_id) ?? null),
    reportedUserLabel: data.reported_user_id
      ? profileLabel(profileMap.get(data.reported_user_id) ?? null)
      : null,
    eventTitle: data.event_id ? eventMap.get(data.event_id) ?? null : null,
    eventId: data.event_id,
  };
}

export async function getAdminGyms(
  supabase: AdminClient,
  search = "",
): Promise<AdminGymListItem[]> {
  const { data, error } = await supabase.rpc("admin_get_gyms", {
    search: sanitizeAdminSearch(search),
  });

  if (error) {
    console.error("admin_get_gyms:", error.message);
    return [];
  }

  return ((data ?? []) as Record<string, unknown>[]).map((raw) => {
    const row = pickRpcFields(raw, ADMIN_GYM_FIELDS);
    return {
      id: String(row.id),
      name: String(row.name ?? ""),
      sport: String(row.sport ?? ""),
      region: String(row.region ?? ""),
      isPublic: Boolean(row.is_public),
      createdAt: String(row.created_at ?? ""),
      ownerLabel: String(row.owner_label ?? "이름 없음"),
      upcomingEventCount: asNumber(row.upcoming_event_count),
    };
  });
}

export async function getAdminEvents(
  supabase: AdminClient,
  options: { search?: string; status?: EventAdminStatus | null } = {},
): Promise<AdminEventListItem[]> {
  const { data, error } = await supabase.rpc("admin_get_events", {
    search: sanitizeAdminSearch(options.search ?? ""),
    p_status: options.status ?? null,
  });

  if (error) {
    console.error("admin_get_events:", error.message);
    return [];
  }

  return ((data ?? []) as Record<string, unknown>[]).map((raw) => {
    const row = pickRpcFields(raw, ADMIN_EVENT_FIELDS);
    return {
      id: String(row.id),
      title: String(row.title ?? ""),
      eventDate: String(row.event_date ?? ""),
      status: String(row.status ?? "active"),
      gymName: String(row.gym_name ?? "체육관"),
      hostLabel: String(row.host_label ?? "이름 없음"),
      applicationCount: asNumber(row.application_count),
    };
  });
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = asNumber(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getAdminEventDetail(
  supabase: AdminClient,
  eventId: string,
): Promise<AdminEventDetail | null> {
  const { data, error } = await supabase.rpc("admin_get_event_detail", {
    event_id: eventId,
  });

  if (error) {
    console.error("admin_get_event_detail:", error.message);
    return null;
  }

  const raw = (Array.isArray(data) ? data[0] : data) as
    | Record<string, unknown>
    | null
    | undefined;

  if (!raw || raw.id == null) return null;

  const row = pickRpcFields(raw, ADMIN_EVENT_DETAIL_FIELDS);

  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    sport: String(row.sport ?? ""),
    eventType: String(row.event_type ?? ""),
    eventDate: String(row.event_date ?? ""),
    eventTime: asOptionalString(row.event_time),
    status: String(row.status ?? "active"),
    region: String(row.region ?? ""),
    address: asOptionalString(row.address),
    gymId: String(row.gym_id ?? ""),
    gymName: String(row.gym_name ?? "체육관"),
    gymIsPublic: Boolean(row.gym_is_public),
    hostLabel: String(row.host_label ?? "이름 없음"),
    maxParticipants: asOptionalNumber(row.max_participants),
    activeApplicationCount: asNumber(row.active_application_count),
    createdAt: String(row.created_at ?? ""),
    description: asOptionalString(row.description),
    isPubliclyViewable: Boolean(row.is_publicly_viewable),
  };
}

export async function getAdminUsers(
  supabase: AdminClient,
  search = "",
): Promise<AdminUserListItem[]> {
  const { data, error } = await supabase.rpc("admin_get_users", {
    search: sanitizeAdminSearch(search),
  });

  if (error) {
    console.error("admin_get_users:", error.message);
    return [];
  }

  return ((data ?? []) as Record<string, unknown>[]).map((raw) => {
    const row = pickRpcFields(raw, ADMIN_USER_FIELDS);
    return {
      id: String(row.id),
      nickname: (row.nickname as string | null) ?? null,
      displayName: (row.display_name as string | null) ?? null,
      createdAt: String(row.created_at ?? ""),
      isOperator: Boolean(row.is_operator),
      applicationCount: asNumber(row.application_count),
    };
  });
}
