import Link from "next/link";
import type { EventWithGym } from "@/lib/types/database";
import { AppIcon } from "@/components/ui/AppIcon";
import { formatEventType } from "@/lib/constants/event-types";
import {
  formatEventDifficulty,
  formatEventFee,
} from "@/lib/constants/event-meta";
import {
  EVENT_STATUS_LABELS,
  getEventRecruitmentStatus,
} from "@/lib/utils/event-status";
import {
  formatEventDetailDate,
  formatEventTimeDisplay,
} from "@/lib/utils/date";
import {
  OverlayBadgePrimary,
  OverlayBadgeSecondary,
  PhotoBottomGradient,
} from "@/components/ui/OverlayBadge";

type EventCardProps = {
  event: EventWithGym;
  approvedCount?: number;
};

function formatParticipantLine(
  approvedCount: number,
  maxParticipants: number | null,
): string {
  if (maxParticipants != null && maxParticipants > 0) {
    const spotsLeft = maxParticipants - approvedCount;
    if (spotsLeft <= 0) return `${approvedCount}/${maxParticipants}명 · 마감`;
    if (spotsLeft <= 3) return `${approvedCount}/${maxParticipants}명 · ${spotsLeft}자리`;
    return `${approvedCount}/${maxParticipants}명`;
  }
  return `${approvedCount}명 참가`;
}

export function EventCard({ event, approvedCount = 0 }: EventCardProps) {
  const recruitmentStatus = getEventRecruitmentStatus({
    eventDate: event.event_date,
    maxParticipants: event.max_participants,
    approvedCount,
    recruitmentClosed: event.recruitment_closed ?? false,
    registrationDeadline: event.registration_deadline,
  });
  const status = EVENT_STATUS_LABELS[recruitmentStatus];
  const photoUrl = event.gyms?.photo_url;
  const timeLabel = formatEventTimeDisplay(event.event_time);
  const feeLabel = formatEventFee(event.fee_amount);
  const difficultyLabel = formatEventDifficulty(event.difficulty);
  const participantLine = formatParticipantLine(
    approvedCount,
    event.max_participants,
  );

  return (
    <Link
      href={`/events/${event.id}`}
      className="block overflow-hidden border border-zinc-200 bg-white transition hover:border-zinc-400"
    >
      <div className="relative aspect-[16/9] bg-zinc-950">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={event.gyms?.name ?? event.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-black tracking-[0.22em] text-white">
            OHS
          </div>
        )}
        <PhotoBottomGradient />
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          <OverlayBadgePrimary>
            <span className="text-[10px] font-black uppercase tracking-[0.12em]">{event.sport}</span>
          </OverlayBadgePrimary>
          <OverlayBadgeSecondary>
            {formatEventType(event.event_type)}
          </OverlayBadgeSecondary>
          <OverlayBadgeSecondary className={status.className}>
            {status.label}
          </OverlayBadgeSecondary>
        </div>
      </div>

      <div className="p-4">
        <h2 className="line-clamp-2 font-bold leading-snug text-zinc-950">
          {event.title}
        </h2>

        <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
          <AppIcon name="calendar" className="size-4 shrink-0 text-zinc-400" />
          <span>
            {formatEventDetailDate(event.event_date)}
            {timeLabel ? ` · ${timeLabel}` : ""}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-sm text-zinc-600">
          <AppIcon name="map-pin" className="size-4 shrink-0 text-zinc-400" />
          <span className="truncate">
            {event.region}
            {event.gyms?.name ? ` · ${event.gyms.name}` : ""}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <AppIcon name="users" className="size-3.5" />
            {participantLine}
          </span>
          {feeLabel && <span>{feeLabel}</span>}
          {difficultyLabel && <span>{difficultyLabel}</span>}
        </div>
      </div>
    </Link>
  );
}
