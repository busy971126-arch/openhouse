import type { RegistrationStatus } from "@/lib/types/database";
import { getTodayDateString } from "@/lib/utils/date";

export type RegistrationDisplayStatus =
  | "pending"
  | "approved"
  | "cancelled"
  | "rejected"
  | "ended";

export const REGISTRATION_STATUS_DISPLAY: Record<
  RegistrationDisplayStatus,
  { label: string; emoji: string; className: string }
> = {
  pending: { label: "승인 대기", emoji: "🟡", className: "text-amber-700" },
  approved: { label: "참가 확정", emoji: "🟢", className: "text-green-700" },
  ended: { label: "종료", emoji: "⚫", className: "text-zinc-500" },
  cancelled: { label: "참가 취소", emoji: "🔴", className: "text-red-600" },
  rejected: { label: "참가 거절", emoji: "🔴", className: "text-red-600" },
};

export function getRegistrationDisplayStatus(
  status: RegistrationStatus,
  eventDate: string | null,
): RegistrationDisplayStatus {
  if (status === "cancelled") return "cancelled";
  if (status === "rejected") return "rejected";
  if (eventDate && eventDate < getTodayDateString()) return "ended";
  if (status === "approved") return "approved";
  return "pending";
}

export function canCancelRegistration(
  status: RegistrationStatus,
  eventDate: string | null,
): boolean {
  if (status !== "pending" && status !== "approved") return false;
  if (eventDate && eventDate < getTodayDateString()) return false;
  return true;
}
