import type { GymUpcomingEventPreview } from "@/lib/queries/gyms";
import {
  getTodayDateString,
  getTomorrowDateString,
} from "@/lib/utils/date";

/** 목록 카드 사진 위에 표시할 이벤트 한 줄 문구 */
export function getGymEventHighlight(
  upcomingEvents: GymUpcomingEventPreview[],
  upcomingCount: number,
): string | null {
  if (upcomingCount <= 0) return null;

  const next = upcomingEvents[0];
  const today = getTodayDateString();
  const tomorrow = getTomorrowDateString();

  if (next?.event_date === today) {
    return `🔥 오늘 ${next.title}`;
  }

  if (next?.event_date === tomorrow) {
    return `📅 내일 ${next.title}`;
  }

  return `📅 이번주 이벤트 ${upcomingCount}개`;
}

/** 이벤트 하이라이트 탭 시 이동할 경로 */
export function getGymEventHighlightHref(
  upcomingEvents: GymUpcomingEventPreview[],
  highlight: string | null,
): string | null {
  if (!highlight || upcomingEvents.length === 0) return null;

  const first = upcomingEvents[0];
  const today = getTodayDateString();
  const tomorrow = getTomorrowDateString();

  if (first.event_date === today || first.event_date === tomorrow) {
    return `/events/${first.id}`;
  }

  return "#gym-upcoming-events";
}
