import type { EventRecruitmentStatus } from "@/lib/utils/event-status";

export type EventRecruitmentFilter = "recruiting" | "closing_soon" | "all";

export const EVENT_RECRUITMENT_FILTER_OPTIONS: {
  value: EventRecruitmentFilter;
  label: string;
}[] = [
  { value: "recruiting", label: "모집중" },
  { value: "closing_soon", label: "마감 임박" },
  { value: "all", label: "전체" },
];

export function matchesRecruitmentFilter(
  status: EventRecruitmentStatus,
  filter: EventRecruitmentFilter | undefined,
): boolean {
  if (!filter || filter === "all") {
    return status !== "ended";
  }
  if (filter === "recruiting") {
    return status === "recruiting";
  }
  if (filter === "closing_soon") {
    return status === "closing_soon";
  }
  return true;
}
