import type { RegistrationStatus } from "@/lib/types/database";

export type HostParticipantTab = "all" | "approved" | "pending" | "cancelled";

export const HOST_PARTICIPANT_TABS: {
  value: HostParticipantTab;
  label: string;
}[] = [
  { value: "all", label: "전체" },
  { value: "approved", label: "확정" },
  { value: "pending", label: "대기" },
  { value: "cancelled", label: "취소" },
];

export const HOST_STATUS_LABELS: Record<RegistrationStatus, string> = {
  approved: "확정",
  pending: "대기",
  cancelled: "취소",
  rejected: "거절",
};

export const HOST_STATUS_BADGE_CLASS: Record<RegistrationStatus, string> = {
  approved: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  cancelled: "bg-zinc-100 text-zinc-600",
  rejected: "bg-red-50 text-red-600",
};

export function matchesHostParticipantTab(
  status: RegistrationStatus,
  tab: HostParticipantTab,
): boolean {
  if (tab === "all") return true;
  if (tab === "cancelled") return status === "cancelled" || status === "rejected";
  return status === tab;
}
