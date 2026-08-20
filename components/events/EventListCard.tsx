import Link from "next/link";
import type { EventWithGym } from "@/lib/types/database";
import { formatEventType } from "@/lib/constants/event-types";
import {
  formatEventFeeDisplay,
  formatEventTimeRange,
  formatParticipantCount,
} from "@/lib/utils/event-display";
import {
  EVENT_STATUS_LABELS,
  getEventRecruitmentStatus,
} from "@/lib/utils/event-status";
import { formatEventDetailDate } from "@/lib/utils/date";
import { isEventHost } from "@/lib/utils/event-host";
import { InterestHeart } from "@/components/interest/InterestHeart";

function EventEditButton({ eventId }: { eventId: string }) {
  return (
    <Link
      href={`/events/${eventId}/edit`}
      className="inline-flex size-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
      aria-label="이벤트 수정"
      title="수정"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="size-4"
        aria-hidden
      >
        <path d="m2.695 14.762-1.262 3.34a.75.75 0 0 0 1.017 1.017l3.34-1.262a4.5 4.5 0 0 0 2.264-1.984l6.718-6.718a2.25 2.25 0 0 0 0-3.182l-2.182-2.182a2.25 2.25 0 0 0-3.182 0l-6.718 6.718a4.5 4.5 0 0 0-1.977 2.265Z" />
      </svg>
    </Link>
  );
}

type EventListCardProps = {
  event: EventWithGym;
  approvedCount?: number | null;
  userId?: string | null;
  initialInterested?: boolean;
};

export function EventListCard({
  event,
  approvedCount = null,
  userId = null,
  initialInterested = false,
}: EventListCardProps) {
  const recruitmentStatus = getEventRecruitmentStatus({
    eventDate: event.event_date,
    maxParticipants: event.max_participants,
    approvedCount,
    recruitmentClosed: event.recruitment_closed ?? false,
    registrationDeadline: event.registration_deadline,
    eventStatus: event.status ?? "active",
  });
  const status = EVENT_STATUS_LABELS[recruitmentStatus];
  const timeLabel = formatEventTimeRange(event.event_time);
  const participantLine = formatParticipantCount(
    approvedCount,
    event.max_participants,
  );
  const feeLabel = formatEventFeeDisplay(event.fee_amount);
  const showEditButton = isEventHost(userId, event);

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-600">
          <span className="text-zinc-800">{event.sport}</span>
          {" · "}
          <span className={status.className}>
            {status.emoji} {status.label}
          </span>
        </p>
        <InterestHeart
          kind="event"
          targetId={event.id}
          initialInterested={initialInterested}
          userId={userId}
          loginRedirect={`/events/${event.id}`}
          size="xs"
        />
      </div>

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

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
        >
          이벤트 보기
        </Link>
        {showEditButton && <EventEditButton eventId={event.id} />}
      </div>
    </article>
  );
}
