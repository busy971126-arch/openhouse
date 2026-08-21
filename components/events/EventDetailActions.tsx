"use client";

import Link from "next/link";
import type { Registration } from "@/lib/types/database";
import { ApplyButton } from "@/app/events/[id]/ApplyButton";
import { CancelButton } from "@/app/events/[id]/CancelButton";
import { EventManageActions } from "@/components/events/EventManageActions";
import { EventPublishButton } from "@/components/events/EventPublishButton";
import type { Event } from "@/lib/types/database";
import { buildHostParticipantsUrl } from "@/lib/utils/host-participants-url";
import type { ParticipantPreview } from "@/lib/utils/participant-preview";

type EventDetailActionsProps = {
  eventId: string;
  event: Pick<
    Event,
    | "id"
    | "gym_id"
    | "created_by"
    | "title"
    | "description"
    | "event_type"
    | "sport"
    | "region"
    | "address"
    | "event_date"
    | "event_time"
    | "recurring_days"
    | "max_participants"
    | "recruitment_closed"
    | "fee_amount"
    | "registration_deadline"
    | "difficulty"
    | "status"
  >;
  userId: string | null;
  isOwner: boolean;
  registration: Registration | null;
  canApply: boolean;
  closedReason?: string;
  weightClass?: string | null;
  gender?: string | null;
  experience?: string | null;
  displayName?: string | null;
  phone?: string | null;
  isGymOperator?: boolean;
  gymAffiliationDefault?: string | null;
  preview?: ParticipantPreview | null;
};

export function EventDetailActions({
  eventId,
  event,
  userId,
  isOwner,
  registration,
  canApply,
  closedReason,
  weightClass,
  gender,
  experience,
  displayName,
  phone,
  isGymOperator,
  gymAffiliationDefault,
  preview,
}: EventDetailActionsProps) {
  if (isOwner) {
    if ((event.status as string | undefined) === "draft") {
      return (
        <div className="flex flex-col gap-3 border-l-2 border-amber-500 py-1 pl-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.14em] text-amber-700">DRAFT · PRIVATE</p>
            <p className="mt-1 text-sm font-bold text-zinc-950">작성 중인 이벤트</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              현재 운영자에게만 보입니다. 내용을 확인한 뒤 공개하세요.
            </p>
          </div>
          <EventPublishButton eventId={eventId} />
          <Link
            href={`/events/${event.id}/edit`}
            className="w-fit text-xs font-bold text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-orange-600"
          >
            상세 정보 수정
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 border-t border-zinc-300 pt-5">
        <p className="text-[10px] font-black tracking-[0.14em] text-zinc-400">HOST ACTIONS</p>
        <Link
          href={buildHostParticipantsUrl(event.gym_id, eventId)}
          className="block bg-zinc-950 py-3 text-center text-sm font-bold text-white transition hover:bg-orange-600"
        >
          참가자 관리
        </Link>
        <EventManageActions event={event} />
      </div>
    );
  }

  if (
    registration &&
    (registration.status === "pending" || registration.status === "approved")
  ) {
    return <CancelButton registration={registration} />;
  }

  return (
    <ApplyButton
      eventId={eventId}
      userId={userId}
      existingRegistration={registration}
      canApply={canApply}
      closedReason={closedReason}
      weightClass={weightClass}
      gender={gender}
      experience={experience}
      displayName={displayName}
      phone={phone}
      isGymOperator={isGymOperator}
      gymAffiliationDefault={gymAffiliationDefault}
      preview={preview}
    />
  );
}
