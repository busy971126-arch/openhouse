import type { EventWithGym } from "@/lib/types/database";
import { getTodayDateString } from "@/lib/utils/date";
import { getWeekDateRange } from "@/lib/utils/event-quick-filters";
import {
  getEventRecruitmentStatus,
  type EventRecruitmentStatus,
} from "@/lib/utils/event-status";
import { regionMatchScore } from "@/lib/utils/gym-search";

export type HomeEventPreviewItem = {
  event: EventWithGym;
  approvedCount: number;
  nearbyLabel?: string;
};

export function isRecruitingEventStatus(status: EventRecruitmentStatus): boolean {
  return status === "recruiting" || status === "closing_soon";
}

export function getEventRecruitmentStatusForEvent(
  event: EventWithGym,
  approvedCount: number,
): EventRecruitmentStatus {
  return getEventRecruitmentStatus({
    eventDate: event.event_date,
    maxParticipants: event.max_participants,
    approvedCount,
    recruitmentClosed: event.recruitment_closed ?? false,
    registrationDeadline: event.registration_deadline,
  });
}

export function isClosingTodayEvent(
  event: EventWithGym,
  approvedCount: number,
  today = getTodayDateString(),
): boolean {
  if (event.registration_deadline !== today) return false;
  return isRecruitingEventStatus(
    getEventRecruitmentStatusForEvent(event, approvedCount),
  );
}

export function isStartingThisWeekEvent(
  event: EventWithGym,
  approvedCount: number,
  today = getTodayDateString(),
): boolean {
  const { start, end } = getWeekDateRange();
  if (event.event_date < today || event.event_date > end) return false;
  if (event.event_date < start) return false;
  return isRecruitingEventStatus(
    getEventRecruitmentStatusForEvent(event, approvedCount),
  );
}

export function formatNearbyEventLabel(
  eventRegion: string,
  profileRegions: string[],
): string {
  const score = regionMatchScore(eventRegion, profileRegions);
  if (score >= 2) return "내 지역";
  if (score >= 1) return "인근 지역";
  return eventRegion;
}

export function sortNearbyEventItems(
  items: HomeEventPreviewItem[],
  profileRegions: string[],
): HomeEventPreviewItem[] {
  return [...items].sort((a, b) => {
    const scoreDiff =
      regionMatchScore(b.event.region, profileRegions) -
      regionMatchScore(a.event.region, profileRegions);
    if (scoreDiff !== 0) return scoreDiff;
    return a.event.event_date.localeCompare(b.event.event_date);
  });
}

export function formatClosingTodayHint(
  registrationDeadline: string | null,
  today = getTodayDateString(),
): string {
  if (registrationDeadline === today) return "오늘까지 신청";
  return "마감 임박";
}
