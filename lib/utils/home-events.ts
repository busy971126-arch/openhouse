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
  approvedCount: number | null;
  nearbyLabel?: string;
};

export function isRecruitingEventStatus(status: EventRecruitmentStatus): boolean {
  return status === "recruiting" || status === "closing_soon";
}

export function getEventRecruitmentStatusForEvent(
  event: EventWithGym,
  approvedCount: number | null,
  today = getTodayDateString(),
): EventRecruitmentStatus {
  return getEventRecruitmentStatus({
    eventDate: event.event_date,
    maxParticipants: event.max_participants,
    approvedCount,
    recruitmentClosed: event.recruitment_closed ?? false,
    adminRecruitmentPaused: Boolean(event.admin_recruitment_paused_at),
    registrationDeadline: event.registration_deadline,
    eventStatus: event.status ?? "active",
    today,
  });
}

export function isClosingTodayEvent(
  event: EventWithGym,
  approvedCount: number | null,
  today = getTodayDateString(),
): boolean {
  if (event.registration_deadline !== today) return false;
  return isRecruitingEventStatus(
    getEventRecruitmentStatusForEvent(event, approvedCount, today),
  );
}

export function isStartingThisWeekEvent(
  event: EventWithGym,
  approvedCount: number | null,
  today = getTodayDateString(),
): boolean {
  const { start, end } = getWeekDateRange(new Date(`${today}T12:00:00`));
  if (event.event_date < today || event.event_date > end) return false;
  if (event.event_date < start) return false;
  return isRecruitingEventStatus(
    getEventRecruitmentStatusForEvent(event, approvedCount, today),
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

export function getHomeEventBadges(item: HomeEventPreviewItem): string[] {
  const badges: string[] = [];
  const status = getEventRecruitmentStatusForEvent(item.event, item.approvedCount);

  if (isClosingTodayEvent(item.event, item.approvedCount)) {
    badges.push("오늘 마감");
  } else if (status === "closing_soon") {
    badges.push("마감 임박");
  }

  if (
    isStartingThisWeekEvent(item.event, item.approvedCount) &&
    !isClosingTodayEvent(item.event, item.approvedCount)
  ) {
    badges.push("이번주");
  }

  if (item.event.difficulty === "beginner") {
    badges.push("초보 환영");
  }

  return badges.slice(0, 2);
}
