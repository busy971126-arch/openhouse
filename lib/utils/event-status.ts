import { getTodayDateString } from "@/lib/utils/date";

export type EventRecruitmentStatus =
  | "recruiting"
  | "closing_soon"
  | "closed"
  | "ended";

export const EVENT_STATUS_LABELS: Record<
  EventRecruitmentStatus,
  { label: string; emoji: string; className: string }
> = {
  recruiting: {
    label: "모집중",
    emoji: "🟢",
    className: "text-green-700",
  },
  closing_soon: {
    label: "마감 임박",
    emoji: "🟡",
    className: "text-amber-700",
  },
  closed: {
    label: "모집 마감",
    emoji: "🔴",
    className: "text-red-700",
  },
  ended: {
    label: "종료",
    emoji: "⚫",
    className: "text-zinc-500",
  },
};

type EventStatusInput = {
  eventDate: string;
  maxParticipants: number | null;
  approvedCount: number;
  recruitmentClosed?: boolean;
  registrationDeadline?: string | null;
};

export function getEventRecruitmentStatus({
  eventDate,
  maxParticipants,
  approvedCount,
  recruitmentClosed = false,
  registrationDeadline = null,
}: EventStatusInput): EventRecruitmentStatus {
  const today = getTodayDateString();

  if (eventDate < today) {
    return "ended";
  }

  if (registrationDeadline && registrationDeadline < today) {
    return "closed";
  }

  if (recruitmentClosed) {
    return "closed";
  }

  if (
    maxParticipants != null &&
    maxParticipants > 0 &&
    approvedCount >= maxParticipants
  ) {
    return "closed";
  }

  const spotsLeft =
    maxParticipants != null ? maxParticipants - approvedCount : null;

  if (spotsLeft != null && spotsLeft > 0 && spotsLeft <= 3) {
    return "closing_soon";
  }

  return "recruiting";
}

export function isOperatingEvent(eventDate: string): boolean {
  return eventDate >= getTodayDateString();
}
