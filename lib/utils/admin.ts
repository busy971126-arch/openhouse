import type { EventLifecycleStatus } from "@/lib/types/database";

export const ADMIN_PATHS = {
  home: "/admin",
  inquiries: "/admin/inquiries",
  reports: "/admin/reports",
  gyms: "/admin/gyms",
  events: "/admin/events",
  users: "/admin/users",
} as const;

export const ADMIN_NAV = [
  { href: ADMIN_PATHS.home, label: "Overview" },
  { href: ADMIN_PATHS.inquiries, label: "Inquiries" },
  { href: ADMIN_PATHS.reports, label: "Reports" },
  { href: ADMIN_PATHS.gyms, label: "Gyms" },
  { href: ADMIN_PATHS.events, label: "Events" },
  { href: ADMIN_PATHS.users, label: "Users" },
] as const;

export const INQUIRY_ADMIN_STATUSES = ["open", "answered", "closed"] as const;
export const REPORT_ADMIN_STATUSES = ["received", "reviewing", "resolved"] as const;
export const EVENT_ADMIN_STATUSES = ["draft", "active", "cancelled"] as const;

export type InquiryAdminStatus = (typeof INQUIRY_ADMIN_STATUSES)[number];
export type ReportAdminStatus = (typeof REPORT_ADMIN_STATUSES)[number];
export type EventAdminStatus = (typeof EVENT_ADMIN_STATUSES)[number];

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
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

export function formatAdminUserLabel(
  nickname: string | null | undefined,
  displayName: string | null | undefined,
): string {
  return nickname?.trim() || displayName?.trim() || "이름 없음";
}

export function formatAdminDateTime(value: string): string {
  return new Date(value).toLocaleString("ko-KR", {
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
