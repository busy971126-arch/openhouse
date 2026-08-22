import { getTodayDateString } from "@/lib/utils/date";
import { sanitizeAdminSearch, type EventAdminStatus } from "@/lib/utils/admin";
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

export type AdminUserListItem = {
  id: string;
  nickname: string | null;
  displayName: string | null;
  createdAt: string;
  isOperator: boolean;
  applicationCount: number;
};

async function counted(
  label: string,
  result: PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<number> {
  const { count, error } = await result;
  if (error) {
    console.error(`admin count ${label}:`, error.message);
    return 0;
  }
  return count ?? 0;
}

function profileLabel(profile: {
  nickname?: string | null;
  display_name?: string | null;
} | null): string {
  return profile?.nickname?.trim() || profile?.display_name?.trim() || "이름 없음";
}

export async function getAdminOverview(
  supabase: AdminClient,
): Promise<AdminOverview> {
  const [
    userCount,
    gymCount,
    publicEventCount,
    draftEventCount,
    activeApplicationCount,
    openInquiryCount,
    openReportCount,
  ] = await Promise.all([
    counted(
      "profiles",
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ),
    counted("gyms", supabase.from("gyms").select("id", { count: "exact", head: true })),
    counted(
      "active events",
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    ),
    counted(
      "draft events",
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft"),
    ),
    counted(
      "applications",
      supabase
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "approved"]),
    ),
    counted(
      "inquiries",
      supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
    ),
    counted(
      "reports",
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .neq("status", "resolved"),
    ),
  ]);

  return {
    userCount,
    gymCount,
    publicEventCount,
    draftEventCount,
    activeApplicationCount,
    openInquiryCount,
    openReportCount,
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
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, nickname, display_name")
        .in("id", userIds)
    : { data: [] };
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, display_name")
    .eq("id", data.user_id)
    .maybeSingle();

  return {
    id: data.id,
    userId: data.user_id,
    category: data.category,
    message: data.message,
    status: data.status,
    adminReply: data.admin_reply,
    createdAt: data.created_at,
    userLabel: profileLabel(profile),
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

  const [{ data: profiles }, { data: events }] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, nickname, display_name").in("id", userIds)
      : Promise.resolve({ data: [] }),
    eventIds.length
      ? supabase.from("events").select("id, title").in("id", eventIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );
  const eventMap = new Map((events ?? []).map((event) => [event.id, event.title]));

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

  const [{ data: profiles }, { data: event }] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, nickname, display_name").in("id", userIds)
      : Promise.resolve({ data: [] }),
    data.event_id
      ? supabase.from("events").select("id, title").eq("id", data.event_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

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
    eventTitle: event?.title ?? null,
    eventId: data.event_id,
  };
}

export async function getAdminGyms(
  supabase: AdminClient,
  search = "",
): Promise<AdminGymListItem[]> {
  let query = supabase
    .from("gyms")
    .select("id, name, sport, region, is_public, created_at, owner_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const trimmed = sanitizeAdminSearch(search);
  if (trimmed) {
    query = query.or(
      `name.ilike.%${trimmed}%,region.ilike.%${trimmed}%,sport.ilike.%${trimmed}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("admin gyms:", error.message);
    return [];
  }

  const rows = data ?? [];
  const ownerIds = [...new Set(rows.map((row) => row.owner_id))];
  const gymIds = rows.map((row) => row.id);
  const today = getTodayDateString();

  const [{ data: profiles }, { data: events }] = await Promise.all([
    ownerIds.length
      ? supabase.from("profiles").select("id, nickname, display_name").in("id", ownerIds)
      : Promise.resolve({ data: [] }),
    gymIds.length
      ? supabase
          .from("events")
          .select("id, gym_id")
          .in("gym_id", gymIds)
          .eq("status", "active")
          .gte("event_date", today)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );
  const upcomingByGym = new Map<string, number>();
  for (const event of events ?? []) {
    upcomingByGym.set(event.gym_id, (upcomingByGym.get(event.gym_id) ?? 0) + 1);
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    sport: row.sport,
    region: row.region,
    isPublic: row.is_public,
    createdAt: row.created_at,
    ownerLabel: profileLabel(profileMap.get(row.owner_id) ?? null),
    upcomingEventCount: upcomingByGym.get(row.id) ?? 0,
  }));
}

export async function getAdminEvents(
  supabase: AdminClient,
  options: { search?: string; status?: EventAdminStatus | null } = {},
): Promise<AdminEventListItem[]> {
  let query = supabase
    .from("events")
    .select("id, title, event_date, status, created_by, gym_id")
    .order("event_date", { ascending: false })
    .limit(100);

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const trimmed = sanitizeAdminSearch(options.search ?? "");
  if (trimmed) {
    query = query.ilike("title", `%${trimmed}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("admin events:", error.message);
    return [];
  }

  const rows = data ?? [];
  const gymIds = [...new Set(rows.map((row) => row.gym_id))];
  const hostIds = [...new Set(rows.map((row) => row.created_by))];
  const eventIds = rows.map((row) => row.id);

  const [{ data: gyms }, { data: profiles }, { data: registrations }] =
    await Promise.all([
      gymIds.length
        ? supabase.from("gyms").select("id, name").in("id", gymIds)
        : Promise.resolve({ data: [] }),
      hostIds.length
        ? supabase
            .from("profiles")
            .select("id, nickname, display_name")
            .in("id", hostIds)
        : Promise.resolve({ data: [] }),
      eventIds.length
        ? supabase
            .from("registrations")
            .select("event_id")
            .in("event_id", eventIds)
            .in("status", ["pending", "approved"])
        : Promise.resolve({ data: [] }),
    ]);

  const gymMap = new Map((gyms ?? []).map((gym) => [gym.id, gym.name]));
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );
  const countMap = new Map<string, number>();
  for (const row of registrations ?? []) {
    countMap.set(row.event_id, (countMap.get(row.event_id) ?? 0) + 1);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    eventDate: row.event_date,
    status: row.status ?? "active",
    gymName: gymMap.get(row.gym_id) ?? "체육관",
    hostLabel: profileLabel(profileMap.get(row.created_by) ?? null),
    applicationCount: countMap.get(row.id) ?? 0,
  }));
}

export async function getAdminUsers(
  supabase: AdminClient,
  search = "",
): Promise<AdminUserListItem[]> {
  let query = supabase
    .from("profiles")
    .select("id, nickname, display_name, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const trimmed = sanitizeAdminSearch(search);
  if (trimmed) {
    query = query.or(`nickname.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("admin users:", error.message);
    return [];
  }

  const rows = data ?? [];
  const userIds = rows.map((row) => row.id);

  const [{ data: gyms }, { data: registrations }] = await Promise.all([
    userIds.length
      ? supabase.from("gyms").select("owner_id").in("owner_id", userIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase.from("registrations").select("user_id").in("user_id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const operatorIds = new Set((gyms ?? []).map((gym) => gym.owner_id));
  const applicationMap = new Map<string, number>();
  for (const row of registrations ?? []) {
    applicationMap.set(row.user_id, (applicationMap.get(row.user_id) ?? 0) + 1);
  }

  return rows.map((row) => ({
    id: row.id,
    nickname: row.nickname,
    displayName: row.display_name,
    createdAt: row.created_at,
    isOperator: operatorIds.has(row.id),
    applicationCount: applicationMap.get(row.id) ?? 0,
  }));
}
