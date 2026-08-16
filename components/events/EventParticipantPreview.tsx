import Link from "next/link";
import type { ParticipantPreview } from "@/lib/utils/participant-preview";
import type {
  ProfileVisibilityField,
  ProfileVisibilityLevel,
} from "@/lib/constants/profile-visibility";
import {
  maskProfileValue,
  type ProfileViewContext,
} from "@/lib/utils/profile-visibility";
import {
  formatExperienceShort,
  sortCountEntries,
} from "@/lib/utils/participant-preview";
import { EventParticipantGenderAccordion } from "@/components/events/EventParticipantGenderAccordion";

type EventParticipantPreviewProps = {
  preview: ParticipantPreview | null;
  previewAnchorId?: string;
  viewerId?: string | null;
  /** 로그인 유저의 체급. null이면 필터 없이 전체 표시 */
  viewerWeightClass?: string | null;
  friendUserIds?: string[];
  visibilityByUserId?: Record<
    string,
    Record<ProfileVisibilityField, ProfileVisibilityLevel>
  >;
};

function getSeekerViewContext(
  viewerId: string | null | undefined,
  seekerUserId: string,
  friendUserIds: string[],
): ProfileViewContext {
  if (!viewerId) return "other";
  if (viewerId === seekerUserId) return "self";
  if (friendUserIds.includes(seekerUserId)) return "friend";
  return "other";
}

function formatSeekerDetails(
  seeker: ParticipantPreview["sparring_seekers"][number],
  context: ProfileViewContext,
  visibilitySettings?: Record<
    ProfileVisibilityField,
    ProfileVisibilityLevel
  >,
): string {
  const parts: string[] = [];

  const weightClass =
    seeker.weight_class === "미입력"
      ? null
      : maskProfileValue(
          seeker.weight_class,
          "weight_class",
          visibilitySettings,
          context,
        );
  const experience =
    seeker.experience === "미입력"
      ? null
      : maskProfileValue(
          seeker.experience,
          "experience",
          visibilitySettings,
          context,
        );

  if (weightClass) parts.push(weightClass);
  if (experience) parts.push(formatExperienceShort(experience));

  return parts.join(" · ");
}

function CountList({
  title,
  entries,
}: {
  title: string;
  entries: [string, number][];
}) {
  if (entries.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium text-zinc-500">{title}</p>
      <ul className="mt-2 space-y-1">
        {entries.map(([label, count]) => (
          <li key={label} className="flex justify-between text-sm text-zinc-800">
            <span>{label}</span>
            <span className="font-medium">{count}명</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EventParticipantPreview({
  preview,
  previewAnchorId = "participant-preview",
  viewerId = null,
  viewerWeightClass = null,
  friendUserIds = [],
  visibilityByUserId = {},
}: EventParticipantPreviewProps) {
  if (!preview || preview.total === 0) {
    return (
      <section
        id={previewAnchorId}
        className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm scroll-mt-4"
      >
        <h2 className="font-semibold text-zinc-900">예정 참가자 현황</h2>
        <p className="mt-2 text-sm text-zinc-500">
          아직 예정 참가자가 없습니다.
        </p>
      </section>
    );
  }

  if (preview.hidden) {
    return (
      <section
        id={previewAnchorId}
        className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm scroll-mt-4"
      >
        <h2 className="font-semibold text-zinc-900">예정 참가자 현황</h2>
        <p className="mt-2 text-sm text-zinc-600">
          참가 예정 {preview.total}명
        </p>
        <EventParticipantGenderAccordion
          genders={preview.genders}
          participants={preview.participants}
          viewerId={viewerId}
          viewerWeightClass={viewerWeightClass}
          friendUserIds={friendUserIds}
          visibilityByUserId={visibilityByUserId}
        />
        <p className="mt-2 text-xs text-zinc-400">
          3명 이상 모이면 체급·경력 분포를 보여드립니다.
        </p>
      </section>
    );
  }

  const weightEntries = sortCountEntries(preview.weight_classes);
  const backgroundEntries = sortCountEntries(preview.backgrounds);
  const yearEntries = sortCountEntries(preview.experience_years);
  const seekers = preview.sparring_seekers.map((seeker) => {
    const context = getSeekerViewContext(
      viewerId,
      seeker.user_id,
      friendUserIds,
    );
    const visibilitySettings = visibilityByUserId[seeker.user_id];
    const details = formatSeekerDetails(seeker, context, visibilitySettings);

    return { seeker, details };
  });

  return (
    <section
      id={previewAnchorId}
      className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm scroll-mt-4"
    >
      <h2 className="font-semibold text-zinc-900">예정 참가자 현황</h2>
      <p className="mt-1 text-sm text-zinc-600">
        현재 예정 참가자 {preview.total}명
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        이름과 연락처는 공개되지 않습니다.
      </p>

      <EventParticipantGenderAccordion
        genders={preview.genders}
        participants={preview.participants}
        viewerId={viewerId}
        viewerWeightClass={viewerWeightClass}
        friendUserIds={friendUserIds}
        visibilityByUserId={visibilityByUserId}
      />

      <div className="mt-4 space-y-4">
        <CountList title="체급" entries={weightEntries} />
        <CountList title="수련 경력" entries={yearEntries} />
        <CountList title="수련 배경" entries={backgroundEntries} />
      </div>

      {seekers.length > 0 && (
        <div className="mt-5 border-t border-zinc-100 pt-4">
          <p className="text-xs font-medium text-zinc-500">
            대련 상대를 찾는 예정 참가자
          </p>
          <ul className="mt-2 space-y-2">
            {seekers.map(({ seeker, details }, index) => (
              <li
                key={`${seeker.user_id}-${index}`}
                className="rounded-lg bg-orange-50 px-3 py-2 text-sm text-zinc-800"
              >
                <Link
                  href={`/users/${seeker.user_id}`}
                  className="font-medium text-orange-900 hover:underline"
                >
                  {seeker.nickname}
                </Link>
                {details && (
                  <>
                    {" · "}
                    {details}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
