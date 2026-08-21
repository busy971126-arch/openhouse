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
  /** pending + approved. null = count unavailable, skip capacity judgment */
  approvedCount: number | null;
  recruitmentClosed?: boolean;
  registrationDeadline?: string | null;
  eventStatus?: string | null;
  today?: string;
};

export function getEventRecruitmentStatus({
  eventDate,
  maxParticipants,
  approvedCount,
  recruitmentClosed = false,
  registrationDeadline = null,
  eventStatus = "active",
  today = getTodayDateString(),
}: EventStatusInput): EventRecruitmentStatus {
  if (eventStatus === "cancelled" || eventStatus === "draft") {
    return "closed";
  }

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
    approvedCount != null &&
    maxParticipants != null &&
    maxParticipants > 0 &&
    approvedCount >= maxParticipants
  ) {
    return "closed";
  }

  const spotsLeft =
    approvedCount != null && maxParticipants != null
      ? maxParticipants - approvedCount
      : null;

  if (spotsLeft != null && spotsLeft > 0 && spotsLeft <= 3) {
    return "closing_soon";
  }

  return "recruiting";
}

export function isEventAtCapacity(
  maxParticipants: number | null,
  approvedCount: number | null,
): boolean {
  return (
    approvedCount != null &&
    maxParticipants != null &&
    maxParticipants > 0 &&
    approvedCount >= maxParticipants
  );
}

export function isOperatingEvent(eventDate: string): boolean {
  return eventDate >= getTodayDateString();
}

type RegistrationApplyGuardInput = {
  status?: string | null;
  recruitment_closed: boolean;
  registration_deadline: string | null;
  today?: string;
};

/** Server/API closure rule. Does not include capacity (DB trigger is authoritative). */
export function getRegistrationApplyBlockMessage({
  status,
  recruitment_closed,
  registration_deadline,
  today = getTodayDateString(),
}: RegistrationApplyGuardInput): string | null {
  if (status === "draft") {
    return "아직 공개되지 않은 이벤트입니다.";
  }

  if ((status ?? "active") !== "active") {
    return "취소된 이벤트입니다.";
  }

  if (recruitment_closed) {
    return "신청이 마감된 이벤트입니다.";
  }

  if (registration_deadline && registration_deadline < today) {
    return "신청이 마감된 이벤트입니다.";
  }

  return null;
}
