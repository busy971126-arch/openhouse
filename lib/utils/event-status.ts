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

function getSeoulDateTime(now = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

function hasEventStarted(
  eventDate: string,
  eventTime: string | null | undefined,
  today: string,
  currentTime: string,
): boolean {
  if (eventDate < today) return true;
  if (eventDate > today) return false;
  if (!eventTime?.trim()) return false;
  return eventTime.slice(0, 5) <= currentTime;
}

type EventStatusInput = {
  eventDate: string;
  eventTime?: string | null;
  maxParticipants: number | null;
  /** pending + approved. null = count unavailable, skip capacity judgment */
  approvedCount: number | null;
  recruitmentClosed?: boolean;
  registrationDeadline?: string | null;
  eventStatus?: string | null;
  today?: string;
  currentTime?: string;
};

export function getEventRecruitmentStatus({
  eventDate,
  eventTime = null,
  maxParticipants,
  approvedCount,
  recruitmentClosed = false,
  registrationDeadline = null,
  eventStatus = "active",
  today,
  currentTime,
}: EventStatusInput): EventRecruitmentStatus {
  const seoulNow = getSeoulDateTime();
  const resolvedToday = today ?? seoulNow.date;
  const resolvedCurrentTime = currentTime ?? seoulNow.time;

  if (eventStatus === "cancelled" || eventStatus === "draft") {
    return "closed";
  }

  if (hasEventStarted(eventDate, eventTime, resolvedToday, resolvedCurrentTime)) {
    return "ended";
  }

  if (registrationDeadline && registrationDeadline < resolvedToday) {
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
  return eventDate >= getSeoulDateTime().date;
}

type RegistrationApplyGuardInput = {
  status?: string | null;
  recruitment_closed: boolean;
  registration_deadline: string | null;
  event_date?: string | null;
  event_time?: string | null;
  today?: string;
  currentTime?: string;
};

/** Server/API closure rule. Capacity and lifecycle rules are also enforced by DB trigger. */
export function getRegistrationApplyBlockMessage({
  status,
  recruitment_closed,
  registration_deadline,
  event_date,
  event_time,
  today,
  currentTime,
}: RegistrationApplyGuardInput): string | null {
  const seoulNow = getSeoulDateTime();
  const resolvedToday = today ?? seoulNow.date;
  const resolvedCurrentTime = currentTime ?? seoulNow.time;

  if (status === "draft") {
    return "아직 공개되지 않은 이벤트입니다.";
  }

  if ((status ?? "active") !== "active") {
    return "취소된 이벤트입니다.";
  }

  if (
    event_date &&
    hasEventStarted(event_date, event_time, resolvedToday, resolvedCurrentTime)
  ) {
    return event_date < resolvedToday
      ? "이미 종료된 이벤트입니다."
      : "이미 시작된 이벤트입니다.";
  }

  if (recruitment_closed) {
    return "신청이 마감된 이벤트입니다.";
  }

  if (registration_deadline && registration_deadline < resolvedToday) {
    return "신청이 마감된 이벤트입니다.";
  }

  return null;
}
