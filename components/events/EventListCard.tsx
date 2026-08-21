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
import { AppIcon } from "@/components/ui/AppIcon";

function EventEditButton({ eventId }: { eventId: string }) {
  return (
    <Link
      href={`/events/${eventId}/edit`}
      className="inline-flex size-8 items-center justify-center border border-zinc-300 text-zinc-600 hover:border-orange-500 hover:text-orange-700"
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
    eventTime: event.event_time,
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
  const href = `/events/${event.id}`;

  return (
    <article className="border-b border-zinc-200 pb-5 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
            {event.sport}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-400">
            {formatEventType(event.event_type)}
          </span>
          <span className={`text-[11px] font-bold ${status.className}`}>
            {status.label}
          </span>
        </div>
        <InterestHeart
          kind="event"
          targetId={event.id}
          initialInterested={initialInterested}
          userId={userId}
          loginRedirect={href}
          size="xs"
        />
      </div>

      <Link href={href} className="group block">
        <h2 className="mt-2 text-[19px] font-black leading-snug tracking-[-0.025em] text-zinc-950 group-hover:text-orange-700">
          {event.title}
        </h2>

        <div className="mt-4 grid gap-2 text-sm text-zinc-600">
          <div className="flex items-center gap-2">
            <AppIcon name="calendar" className="size-4 shrink-0 text-zinc-400" />
            <span>
              {formatEventDetailDate(event.event_date)}
              {timeLabel ? ` · ${timeLabel}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AppIcon name="map-pin" className="size-4 shrink-0 text-zinc-400" />
            <span className="truncate">
              {event.gyms?.name ?? "체육관"}
              {event.region ? ` · ${event.region}` : ""}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <AppIcon name="users" className="size-3.5" />
              {participantLine}
            </span>
            <span>{feeLabel}</span>
          </div>
        </div>
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <Link
          href={href}
          className="text-xs font-bold text-orange-600 hover:text-orange-700"
        >
          자세히 보기 →
        </Link>
        {showEditButton && <EventEditButton eventId={event.id} />}
      </div>
    </article>
  );
}
