import Link from "next/link";
import type { EventWithGym } from "@/lib/types/database";
import { formatEventType } from "@/lib/constants/event-types";
import { formatEventFeeDisplay, formatEventTimeRange, formatParticipantCount } from "@/lib/utils/event-display";
import {
  EVENT_STATUS_LABELS,
  getEventRecruitmentStatus,
} from "@/lib/utils/event-status";
import { formatEventDetailDate } from "@/lib/utils/date";

type EventListCardProps = {
  event: EventWithGym;
  approvedCount?: number;
};

export function EventListCard({ event, approvedCount = 0 }: EventListCardProps) {
  const recruitmentStatus = getEventRecruitmentStatus({
    eventDate: event.event_date,
    maxParticipants: event.max_participants,
    approvedCount,
    recruitmentClosed: event.recruitment_closed ?? false,
    registrationDeadline: event.registration_deadline,
  });
  const status = EVENT_STATUS_LABELS[recruitmentStatus];
  const timeLabel = formatEventTimeRange(event.event_time);
  const participantLine = formatParticipantCount(
    approvedCount,
    event.max_participants,
  );
  const feeLabel = formatEventFeeDisplay(event.fee_amount);

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-zinc-600">
        <span className="text-zinc-800">{event.sport}</span>
        {" · "}
        <span className={status.className}>
          {status.emoji} {status.label}
        </span>
      </p>

      <h2 className="mt-2 text-lg font-semibold leading-snug text-zinc-900">
        {event.title}
      </h2>

      <p className="mt-1 text-xs text-zinc-500">
        {formatEventType(event.event_type)}
      </p>

      <div className="mt-3 space-y-1 text-sm text-zinc-700">
        <p>{formatEventDetailDate(event.event_date)}</p>
        {timeLabel && <p>{timeLabel}</p>}
        <p>
          📍 {event.gyms?.name ?? "체육관"}
          {event.region ? ` · ${event.region}` : ""}
        </p>
        <p>
          👥 {participantLine}
          {" · "}
          💰 {feeLabel}
        </p>
      </div>

      <Link
        href={`/events/${event.id}`}
        className="mt-4 block rounded-lg bg-orange-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-orange-700"
      >
        이벤트 보기
      </Link>
    </article>
  );
}
