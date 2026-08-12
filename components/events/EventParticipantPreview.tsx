import Link from "next/link";
import type { ParticipantPreview } from "@/lib/utils/participant-preview";
import {
  formatExperienceShort,
  sortCountEntries,
} from "@/lib/utils/participant-preview";

type EventParticipantPreviewProps = {
  preview: ParticipantPreview | null;
  currentUserSeeking?: boolean;
  previewAnchorId?: string;
};

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
  currentUserSeeking,
  previewAnchorId = "participant-preview",
}: EventParticipantPreviewProps) {
  if (!preview || preview.total === 0) {
    return (
      <section
        id={previewAnchorId}
        className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm scroll-mt-4"
      >
        <h2 className="font-semibold text-zinc-900">참가자 현황</h2>
        <p className="mt-2 text-sm text-zinc-500">
          아직 참가 예정자가 없습니다.
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
        <h2 className="font-semibold text-zinc-900">참가자 현황</h2>
        <p className="mt-2 text-sm text-zinc-600">
          참가 예정 {preview.total}명
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          3명 이상 모이면 체급·경력 분포를 보여드립니다.
        </p>
      </section>
    );
  }

  const weightEntries = sortCountEntries(preview.weight_classes);
  const backgroundEntries = sortCountEntries(preview.backgrounds);
  const yearEntries = sortCountEntries(preview.experience_years);
  const seekers = preview.sparring_seekers.filter(
    (seeker) => seeker.weight_class !== "미입력" || seeker.experience !== "미입력",
  );

  return (
    <section
      id={previewAnchorId}
      className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm scroll-mt-4"
    >
      <h2 className="font-semibold text-zinc-900">참가자 현황</h2>
      <p className="mt-1 text-sm text-zinc-600">
        현재 참가자 {preview.total}명
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        이름과 연락처는 일반 참가자에게 공개되지 않습니다. 대련 찾기 참가자는
        닉네임이 표시됩니다.
      </p>

      <div className="mt-4">
        <p className="text-xs font-medium text-zinc-500">대련 매칭 정보</p>
      </div>

      <div className="mt-3 space-y-4">
        <CountList title="체급" entries={weightEntries} />
        <CountList title="수련 경력" entries={yearEntries} />
        <CountList title="수련 배경" entries={backgroundEntries} />
      </div>

      {seekers.length > 0 && (
        <div className="mt-5 border-t border-zinc-100 pt-4">
          <p className="text-xs font-medium text-zinc-500">
            대련 상대를 찾는 참가자
          </p>
          <ul className="mt-2 space-y-2">
            {seekers.map((seeker, index) => (
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
                {" · "}
                {seeker.weight_class} · {formatExperienceShort(seeker.experience)}
              </li>
            ))}
          </ul>
          {currentUserSeeking && (
            <p className="mt-2 text-xs text-orange-700">
              내 닉네임·체급·경력이 다른 참가자에게도 표시됩니다.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
