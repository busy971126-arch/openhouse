"use client";

import Link from "next/link";
import { ParticipantLicenseCard } from "@/components/participants/ParticipantLicenseCard";
import { ParticipantProfileLink } from "@/components/profile/ParticipantProfileLink";
import type { ParticipantItem } from "@/lib/utils/participant-items";

type HostParticipantListItemProps = {
  eventId: string;
  participant: ParticipantItem;
};

export function HostParticipantListItem({
  eventId,
  participant,
}: HostParticipantListItemProps) {
  return (
    <li>
      <ParticipantLicenseCard
        displayName={participant.displayName}
        nickname={participant.nickname}
        gender={participant.gender}
        weightClass={participant.weightClass}
        experience={participant.experience}
        ageGroup={participant.ageGroup}
        preferredSports={participant.preferredSports}
        status={participant.status}
        registrationId={participant.id}
        variant="compact"
      />

      <div className="mt-2 flex flex-col gap-2">
        {participant.userId && participant.status === "approved" && (
          <ParticipantProfileLink
            userId={participant.userId}
            className="flex w-full items-center justify-center rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            프로필 · 친구 추가
          </ParticipantProfileLink>
        )}

        <Link
          href={`/host/participants/${eventId}/${participant.id}`}
          className="flex w-full items-center justify-center rounded-lg border border-orange-200 bg-orange-50 py-2 text-sm font-medium text-orange-800 hover:bg-orange-100"
        >
          라이선스 보기
        </Link>
      </div>
    </li>
  );
}
