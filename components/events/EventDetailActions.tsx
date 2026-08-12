"use client";

import Link from "next/link";
import type { Registration } from "@/lib/types/database";
import { ApplyButton } from "@/app/events/[id]/ApplyButton";
import { CancelButton } from "@/app/events/[id]/CancelButton";
import { EventManageActions } from "@/components/events/EventManageActions";
import type { Event } from "@/lib/types/database";
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
    | "event_date"
    | "event_time"
    | "max_participants"
    | "recruitment_closed"
    | "fee_amount"
    | "registration_deadline"
    | "difficulty"
  >;
  userId: string | null;
  isOwner: boolean;
  registration: Registration | null;
  canApply: boolean;
  closedReason?: string;
  weightClass?: string | null;
  gender?: string | null;
  experience?: string | null;
  isGymOperator?: boolean;
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
  isGymOperator,
  preview,
}: EventDetailActionsProps) {
  if (isOwner) {
    return (
      <div className="flex flex-col gap-3">
        <Link
          href={`/events/${eventId}/participants`}
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
      isGymOperator={isGymOperator}
      preview={preview}
    />
  );
}
