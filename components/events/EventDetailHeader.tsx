import type { ReactNode } from "react";
import { getSportEmoji } from "@/lib/constants/profile";
import {
  formatEventDifficulty,
  formatEventFee,
  formatRegistrationDeadline,
} from "@/lib/constants/event-meta";
import type { EventDifficulty } from "@/lib/types/database";
import type { EventRecruitmentStatus } from "@/lib/utils/event-status";
import { EVENT_STATUS_LABELS } from "@/lib/utils/event-status";
import { GymAddressCopy } from "@/components/gym/GymAddressCopy";
import {
  formatEventDetailDate,
  formatEventTimeDisplay,
  getMapSearchUrl,
} from "@/lib/utils/date";

type EventDetailHeaderProps = {
  sport: string;
  title: string;
  recruitmentStatus: EventRecruitmentStatus;
  eventDate: string;
  eventTime: string | null;
  region: string;
  gymName?: string | null;
  gymAddress?: string | null;
  feeAmount?: number | null;
  registrationDeadline?: string | null;
  difficulty?: EventDifficulty | null;
  approvedCount: number | null;
  maxParticipants: number | null;
  interestSlot?: ReactNode;
};

export function EventDetailHeader({
  sport,
  title,
  recruitmentStatus,
  eventDate,
  eventTime,
  region,
  gymName,
  gymAddress,
  feeAmount,
  registrationDeadline,
  difficulty,
  approvedCount,
  maxParticipants,
  interestSlot,
}: EventDetailHeaderProps) {
  const status = EVENT_STATUS_LABELS[recruitmentStatus];
  const timeLabel = formatEventTimeDisplay(eventTime);
  const feeLabel = formatEventFee(feeAmount);
  const deadlineLabel = formatRegistrationDeadline(registrationDeadline);
  const difficultyLabel = formatEventDifficulty(difficulty);
  const addressLine = gymAddress?.trim() || null;
  const locationLine = addressLine || region;

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <span className="text-zinc-800">
            {getSportEmoji(sport)} {sport}
          </span>
          <span className={`${status.className}`}>
            {status.emoji} {status.label}
          </span>
          {difficultyLabel && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
              {difficultyLabel}
            </span>
          )}
        </div>
        {interestSlot}
      </div>

      <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>

      <div className="space-y-1.5 text-sm text-zinc-700">
        <p className="font-medium text-zinc-900">
          {formatEventDetailDate(eventDate)}
        </p>
        {timeLabel && <p>🕐 {timeLabel}</p>}
        {gymName && <p>🏢 {gymName}</p>}
        {addressLine ? (
          <div className="space-y-2">
            <GymAddressCopy address={addressLine} />
            <a
              href={getMapSearchUrl(addressLine)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              📍 지도 보기
            </a>
          </div>
        ) : (
          <p>📍 {locationLine}</p>
        )}
        {feeLabel && <p>💰 참가비 {feeLabel}</p>}
        {deadlineLabel && <p>📅 신청 마감 {deadlineLabel}</p>}
        {maxParticipants != null && (
          <p>
            👥{" "}
            {approvedCount == null
              ? "인원 확인 불가"
              : `신청 ${approvedCount} / ${maxParticipants}명`}
          </p>
        )}
      </div>
    </header>
  );
}
