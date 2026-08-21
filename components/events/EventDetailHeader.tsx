import type { ReactNode } from "react";
import {
  formatEventDifficulty,
  formatEventFee,
  formatRegistrationDeadline,
} from "@/lib/constants/event-meta";
import type { EventDifficulty } from "@/lib/types/database";
import type { EventRecruitmentStatus } from "@/lib/utils/event-status";
import { EVENT_STATUS_LABELS } from "@/lib/utils/event-status";
import { GymAddressCopy } from "@/components/gym/GymAddressCopy";
import { AppIcon } from "@/components/ui/AppIcon";
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
    <header>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-600">
            {sport}
          </span>
          <span className={`text-[11px] font-bold ${status.className}`}>{status.label}</span>
          {difficultyLabel && (
            <span className="text-[11px] font-semibold text-zinc-500">{difficultyLabel}</span>
          )}
        </div>
        {interestSlot}
      </div>

      <h1 className="mt-3 text-[28px] font-black leading-[1.15] tracking-[-0.035em] text-zinc-950">
        {title}
      </h1>

      <div className="mt-5 grid gap-2.5 border-y border-zinc-200 py-4 text-sm text-zinc-600">
        <div className="flex items-center gap-2">
          <AppIcon name="calendar" className="size-4 shrink-0 text-zinc-400" />
          <span className="font-semibold text-zinc-900">
            {formatEventDetailDate(eventDate)}{timeLabel ? ` · ${timeLabel}` : ""}
          </span>
        </div>
        {gymName && (
          <div className="flex items-center gap-2">
            <AppIcon name="building" className="size-4 shrink-0 text-zinc-400" />
            <span>{gymName}</span>
          </div>
        )}
        {!addressLine && (
          <div className="flex items-center gap-2">
            <AppIcon name="map-pin" className="size-4 shrink-0 text-zinc-400" />
            <span>{locationLine}</span>
          </div>
        )}
        {feeLabel && <p className="text-sm">참가비 <strong className="font-semibold text-zinc-900">{feeLabel}</strong></p>}
        {deadlineLabel && <p className="text-xs text-zinc-500">신청 마감 {deadlineLabel}</p>}
        {maxParticipants != null && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <AppIcon name="users" className="size-3.5" />
            <span>
              {approvedCount == null
                ? "인원 확인 불가"
                : `신청 ${approvedCount} / ${maxParticipants}명`}
            </span>
          </div>
        )}
      </div>

      {addressLine && (
        <div className="mt-4 space-y-2">
          <GymAddressCopy address={addressLine} />
          <a
            href={getMapSearchUrl(addressLine)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-800 hover:border-zinc-500"
          >
            <AppIcon name="map-pin" className="size-4" />
            지도 보기
          </a>
        </div>
      )}
    </header>
  );
}
