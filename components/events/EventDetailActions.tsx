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
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div>
            <p className="text-sm font-semibold text-amber-900">🟡 작성 중 · 비공개</p>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              지금은 운영자에게만 보입니다. 내용을 확인한 뒤 공개해주세요.
            </p>
          </div>
          <EventPublishButton eventId={eventId} />
          <Link
            href={`/events/${event.id}/edit`}
            className="rounded-lg border border-amber-200 bg-white py-2.5 text-center text-sm font-medium text-amber-900 hover:bg-amber-100"
          >
            상세 정보 수정
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        <Link
          href={buildHostParticipantsUrl(event.gym_id, eventId)}
          className="block rounded-lg bg-orange-600 py-3 text-center text-sm font-semibold text-white hover:bg-orange-700"
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
