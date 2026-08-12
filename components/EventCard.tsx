import Link from "next/link";
import type { EventWithGym } from "@/lib/types/database";
import { getSportEmoji } from "@/lib/constants/profile";
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
    if (spotsLeft <= 0) return `👥 ${approvedCount}/${maxParticipants}명 · 마감`;
    if (spotsLeft <= 3) return `👥 ${approvedCount}/${maxParticipants}명 · ${spotsLeft}자리`;
    return `👥 ${approvedCount}/${maxParticipants}명`;
  }
  return `👥 ${approvedCount}명 참가`;
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
      className="block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-orange-300 hover:shadow-md"
    >
      <div className="relative aspect-[16/9] bg-gradient-to-br from-zinc-100 to-zinc-200">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={event.gyms?.name ?? event.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">
            {getSportEmoji(event.sport)}
          </div>
        )}
        <PhotoBottomGradient />
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          <OverlayBadgePrimary>
            {getSportEmoji(event.sport)} {event.sport}
          </OverlayBadgePrimary>
          <OverlayBadgeSecondary>
            {formatEventType(event.event_type)}
          </OverlayBadgeSecondary>
          <OverlayBadgeSecondary className={status.className}>
            {status.emoji} {status.label}
          </OverlayBadgeSecondary>
        </div>
      </div>

      <div className="p-4">
        <h2 className="line-clamp-2 font-semibold leading-snug text-zinc-900">
          {event.title}
        </h2>

        <p className="mt-2 text-sm text-zinc-600">
          📅 {formatEventDetailDate(event.event_date)}
          {timeLabel ? ` · ${timeLabel}` : ""}
        </p>
        <p className="mt-0.5 text-sm text-zinc-600">
          📍 {event.region}
          {event.gyms?.name ? ` · ${event.gyms.name}` : ""}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span>{participantLine}</span>
          {feeLabel && <span>{feeLabel}</span>}
          {difficultyLabel && <span>{difficultyLabel}</span>}
        </div>
      </div>
    </Link>
  );
}
