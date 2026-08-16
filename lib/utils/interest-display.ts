import type { EventRecruitmentStatus } from "@/lib/utils/event-status";
import { formatEventType } from "@/lib/constants/event-types";
import { formatEventDate } from "@/lib/utils/date";

const INTEREST_STATUS_LABELS: Record<EventRecruitmentStatus, string> = {
  recruiting: "신청 가능",
  closing_soon: "마감 임박",
  closed: "모집 종료",
  ended: "종료",
};

export function formatInterestEventStatusLine(
  eventDate: string,
  eventType: string,
  recruitmentStatus: EventRecruitmentStatus,
): string {
  const dateLabel = formatEventDate(eventDate);
  const typeLabel = formatEventType(eventType as "open_mat" | "seminar" | "competition");
  const statusLabel = INTEREST_STATUS_LABELS[recruitmentStatus];
  return `${dateLabel} ${typeLabel} · ${statusLabel}`;
}

export function getInterestToastMessage(
  kind: "gym" | "event",
  interested: boolean,
): string {
  if (kind === "gym") {
    return interested
      ? "관심 체육관에 등록했어요."
      : "관심 체육관에서 삭제했어요.";
  }

  return interested
    ? "관심 이벤트에 등록했어요."
    : "관심 이벤트에서 삭제했어요.";
}
