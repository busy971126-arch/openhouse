import type { RegistrationStatus } from "@/lib/types/database";
import type { ParticipantItem } from "@/lib/utils/participant-items";
import {
  isAthleteBackgroundProfile,
  parseApplyExperience,
} from "@/lib/utils/experience-apply";

/** 스키마: pending | approved | rejected | cancelled (001_initial_schema.sql) */
export type HostParticipantTab =
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export const HOST_PARTICIPANT_TABS: {
  value: HostParticipantTab;
  label: string;
}[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "대기" },
  { value: "approved", label: "확정" },
  { value: "rejected", label: "거절" },
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
  return status === tab;
}

export function countHostParticipantsByTab(
  registrations: ParticipantItem[],
): Record<HostParticipantTab, number> {
  const counts: Record<HostParticipantTab, number> = {
    all: registrations.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  };

  for (const registration of registrations) {
    if (registration.status === "pending") counts.pending += 1;
    if (registration.status === "approved") counts.approved += 1;
    if (registration.status === "rejected") counts.rejected += 1;
    if (registration.status === "cancelled") counts.cancelled += 1;
  }

  return counts;
}

export function countActiveHostParticipants(
  registrations: ParticipantItem[],
): number {
  return registrations.filter(
    (registration) =>
      registration.status === "pending" || registration.status === "approved",
  ).length;
}

export function getHostParticipantDisplayName(
  participant: Pick<ParticipantItem, "nickname" | "displayName">,
): string {
  return participant.nickname?.trim() || participant.displayName?.trim() || "익명";
}

export function formatHostParticipantGenderShort(
  gender: string | null | undefined,
): string | null {
  if (gender === "남성") return "남";
  if (gender === "여성") return "여";
  return null;
}

export function formatHostParticipantExperienceShort(
  experience: string | null | undefined,
): string | null {
  if (!experience?.trim()) return null;

  if (isAthleteBackgroundProfile(experience)) return "엘리트";

  const { background } = parseApplyExperience(experience);
  if (background === "일반 수련자") return "일반";
  if (background === "지도자") return "지도자";

  return null;
}

export function formatHostParticipantSubline(
  participant: Pick<
    ParticipantItem,
    "weightClass" | "gender" | "gymAffiliation" | "preferredSports" | "experience"
  >,
): string {
  const parts = [
    participant.preferredSports?.[0]?.trim(),
    formatHostParticipantExperienceShort(participant.experience),
    participant.weightClass?.trim(),
    formatHostParticipantGenderShort(participant.gender),
    participant.gymAffiliation?.trim(),
  ].filter((value): value is string => Boolean(value));

  return parts.length > 0 ? parts.join(" · ") : "정보 없음";
}
