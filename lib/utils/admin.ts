import type { EventLifecycleStatus } from "@/lib/types/database";

export const ADMIN_PATHS = {
  home: "/admin",
  applications: "/admin/applications",
  inquiries: "/admin/inquiries",
  reports: "/admin/reports",
  gyms: "/admin/gyms",
  events: "/admin/events",
  users: "/admin/users",
} as const;

export const ADMIN_NAV = [
  { href: ADMIN_PATHS.home, label: "Overview" },
  { href: ADMIN_PATHS.applications, label: "Applications" },
  { href: ADMIN_PATHS.inquiries, label: "Inquiries" },
  { href: ADMIN_PATHS.reports, label: "Reports" },
  { href: ADMIN_PATHS.gyms, label: "Gyms" },
  { href: ADMIN_PATHS.events, label: "Events" },
  { href: ADMIN_PATHS.users, label: "Users" },
] as const;

export const INQUIRY_ADMIN_STATUSES = ["open", "answered", "closed"] as const;
export const REPORT_ADMIN_STATUSES = ["received", "reviewing", "resolved"] as const;
export const EVENT_ADMIN_STATUSES = ["draft", "active", "cancelled"] as const;
export const APPLICATION_ADMIN_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const;
export const EVENT_ADMIN_ACTIONS = [
  "event.hide",
  "event.restore",
  "event.recruitment_pause",
  "event.recruitment_resume",
] as const;

export type InquiryAdminStatus = (typeof INQUIRY_ADMIN_STATUSES)[number];
export type ReportAdminStatus = (typeof REPORT_ADMIN_STATUSES)[number];
export type EventAdminStatus = (typeof EVENT_ADMIN_STATUSES)[number];
export type ApplicationAdminStatus = (typeof APPLICATION_ADMIN_STATUSES)[number];
export type EventAdminAction = (typeof EVENT_ADMIN_ACTIONS)[number];

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function adminEventPath(id: string): string {
  return `${ADMIN_PATHS.events}/${id}`;
}

export function adminApplicationPath(id: string): string {
  return `${ADMIN_PATHS.applications}/${id}`;
}

export function adminActivityHref(item: {
  targetType: string;
  targetId: string;
  eventId: string | null;
}): string | null {
  if (item.targetType === "registration" && item.targetId) {
    return adminApplicationPath(item.targetId);
  }
  if (item.targetType === "event" && (item.eventId || item.targetId)) {
    return adminEventPath(item.eventId || item.targetId);
  }
  if (item.targetType === "inquiry" && item.targetId) {
    return `${ADMIN_PATHS.inquiries}/${item.targetId}`;
  }
  if (item.targetType === "report" && item.targetId) {
    return `${ADMIN_PATHS.reports}/${item.targetId}`;
  }
  return null;
}

export function isAdminEventPubliclyViewable(
  status: string | null | undefined,
  gymIsPublic: boolean,
): boolean {
  return gymIsPublic && status !== "draft";
}

export function sanitizeAdminSearch(value: string): string {
  return value.replace(/[%_,]/g, " ").replace(/\s+/g, " ").trim();
}

export function parseInquiryStatus(value: unknown): InquiryAdminStatus | null {
  return INQUIRY_ADMIN_STATUSES.includes(value as InquiryAdminStatus)
    ? (value as InquiryAdminStatus)
    : null;
}

export function parseReportStatus(value: unknown): ReportAdminStatus | null {
  return REPORT_ADMIN_STATUSES.includes(value as ReportAdminStatus)
    ? (value as ReportAdminStatus)
    : null;
}

export function parseEventAdminStatus(value: unknown): EventAdminStatus | null {
  return EVENT_ADMIN_STATUSES.includes(value as EventAdminStatus)
    ? (value as EventAdminStatus)
    : null;
}

export function parseApplicationAdminStatus(
  value: unknown,
): ApplicationAdminStatus | null {
  return APPLICATION_ADMIN_STATUSES.includes(value as ApplicationAdminStatus)
    ? (value as ApplicationAdminStatus)
    : null;
}

export function parseEventAdminAction(value: unknown): EventAdminAction | null {
  return EVENT_ADMIN_ACTIONS.includes(value as EventAdminAction)
    ? (value as EventAdminAction)
    : null;
}

export function toKstDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function formatApplicationAdminStatus(status: string): string {
  if (status === "pending") return "대기";
  if (status === "approved") return "확정";
  if (status === "rejected") return "거절";
  if (status === "cancelled") return "취소";
  return status;
}

export function formatAdminActivity(action: string, actorType: string): string {
  if (action === "registration.created") return "신청 생성";
  if (action === "registration.approved") return "신청 확정";
  if (action === "registration.cancelled") return "신청 취소";
  if (action === "event.created") return "이벤트 생성";
  if (action === "event.published") return "이벤트 공개";
  if (action === "event.cancelled") return "이벤트 취소";
  if (action === "event.hide") return "이벤트 숨김";
  if (action === "event.restore") return "이벤트 공개 복구";
  if (action === "event.recruitment_pause") return "신청 중지";
  if (action === "event.recruitment_resume") return "신청 재개";
  if (action === "inquiry.update") return "문의 처리";
  if (action === "report.update") return "신고 상태 변경";
  return actorType === "admin" ? `운영 ${action}` : action;
}

export function formatAdminUserLabel(
  nickname: string | null | undefined,
  displayName: string | null | undefined,
): string {
  return nickname?.trim() || displayName?.trim() || "이름 없음";
}

export function formatAdminDateTime(value: string): string {
  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAdminDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatEventAdminStatus(
  status: EventLifecycleStatus | string | null | undefined,
): string {
  if (status === "draft") return "Draft";
  if (status === "cancelled") return "Cancelled";
  return "Active";
}

export function resolveInquiryReplyStatus(
  currentStatus: string,
  nextStatus: InquiryAdminStatus | null,
  reply: string,
): InquiryAdminStatus {
  if (nextStatus) return nextStatus;
  if (reply && currentStatus === "open") return "answered";
  return parseInquiryStatus(currentStatus) ?? "open";
}
