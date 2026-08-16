"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  ProfileVisibilityField,
  ProfileVisibilityLevel,
} from "@/lib/constants/profile-visibility";
import {
  computeGenderCountsFromParticipants,
  filterParticipantsByViewerWeightClass,
  formatExperienceShort,
  formatGenderSummary,
  formatPreviewParticipantGender,
  type PreviewParticipant,
} from "@/lib/utils/participant-preview";
import {
  maskProfileValue,
  type ProfileViewContext,
} from "@/lib/utils/profile-visibility";

type EventParticipantGenderAccordionProps = {
  genders: Record<string, number>;
  participants: PreviewParticipant[];
  viewerId?: string | null;
  /** 로그인 유저의 체급. null이면 필터 없이 전체 표시 */
  viewerWeightClass?: string | null;
  friendUserIds?: string[];
  visibilityByUserId?: Record<
    string,
    Record<ProfileVisibilityField, ProfileVisibilityLevel>
  >;
};

function getParticipantViewContext(
  viewerId: string | null | undefined,
  participantUserId: string,
  friendUserIds: string[],
): ProfileViewContext {
  if (!viewerId) return "other";
  if (viewerId === participantUserId) return "self";
  if (friendUserIds.includes(participantUserId)) return "friend";
  return "other";
}

function formatParticipantDetails(
  participant: PreviewParticipant,
  context: ProfileViewContext,
  visibilitySettings?: Record<
    ProfileVisibilityField,
    ProfileVisibilityLevel
  >,
): string {
  const parts: string[] = [];

  const genderLabel = formatPreviewParticipantGender(participant.gender);
  if (genderLabel) parts.push(genderLabel);

  const weightClass =
    participant.weight_class === "미입력"
      ? null
      : maskProfileValue(
          participant.weight_class,
          "weight_class",
          visibilitySettings,
          context,
        );
  const experience =
    participant.experience === "미입력"
      ? null
      : maskProfileValue(
          participant.experience,
          "experience",
          visibilitySettings,
          context,
        );

  if (weightClass) parts.push(weightClass);
  if (experience) parts.push(formatExperienceShort(experience));

  return parts.join(" · ");
}

export function EventParticipantGenderAccordion({
  genders,
  participants,
  viewerId = null,
  viewerWeightClass = null,
  friendUserIds = [],
  visibilityByUserId = {},
}: EventParticipantGenderAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAllWeightClasses, setShowAllWeightClasses] = useState(false);
  const canFilterByWeightClass = Boolean(viewerWeightClass);
  const visibleParticipants = canFilterByWeightClass && !showAllWeightClasses
    ? filterParticipantsByViewerWeightClass(participants, viewerWeightClass)
    : participants;
  const genderSummary = (() => {
    if (canFilterByWeightClass && !showAllWeightClasses) {
      const filteredSummary = formatGenderSummary(
        computeGenderCountsFromParticipants(visibleParticipants),
      );
      if (filteredSummary) return filteredSummary;
      if (participants.length > 0) return "내 체급 예정 참가자 없음";
    }
    return formatGenderSummary(genders);
  })();

  if (!genderSummary || participants.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
        aria-expanded={expanded}
      >
        <span className="text-sm font-medium text-zinc-800">
          {genderSummary}
          {canFilterByWeightClass && !showAllWeightClasses && (
            <span className="ml-1 text-xs font-normal text-zinc-500">
              (내 체급)
            </span>
          )}
        </span>
        <span className="shrink-0 text-xs text-zinc-500">
          {expanded ? "접기" : "목록 보기"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-zinc-200 px-3 py-3">
          {canFilterByWeightClass && (
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllWeightClasses((showAll) => !showAll)}
                className="text-xs font-medium text-orange-700 hover:text-orange-900"
              >
                {showAllWeightClasses ? "내 체급만 보기" : "내 체급외 확인하기"}
              </button>
            </div>
          )}

          {visibleParticipants.length === 0 ? (
            <p className="text-sm text-zinc-500">
              같은 체급 예정 참가자가 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {visibleParticipants.map((participant) => {
            const context = getParticipantViewContext(
              viewerId,
              participant.user_id,
              friendUserIds,
            );
            const visibilitySettings = visibilityByUserId[participant.user_id];
            const details = formatParticipantDetails(
              participant,
              context,
              visibilitySettings,
            );

            return (
              <li
                key={participant.user_id}
                className="rounded-lg bg-white px-3 py-2 text-sm text-zinc-800"
              >
                <Link
                  href={`/users/${participant.user_id}`}
                  className="font-medium text-orange-900 hover:underline"
                >
                  {participant.nickname}
                </Link>
                {details && (
                  <>
                    {" · "}
                    {details}
                  </>
                )}
              </li>
            );
          })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
