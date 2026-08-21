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
  requiresAuth?: boolean;
  loginHref?: string;
  viewerId?: string | null;
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
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">{title}</p>
      <ul className="mt-2 divide-y divide-zinc-200 border-y border-zinc-200">
        {entries.map(([label, count]) => (
          <li key={label} className="flex justify-between py-2 text-sm text-zinc-800">
            <span>{label}</span>
            <span className="font-bold text-zinc-950">{count}명</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewShell({
  previewAnchorId,
  children,
}: {
  previewAnchorId: string;
  children: React.ReactNode;
}) {
  return (
    <section id={previewAnchorId} className="scroll-mt-4 border-t border-zinc-300 pt-5">
      <p className="text-[10px] font-black tracking-[0.16em] text-zinc-400">WHO'S IN</p>
      <h2 className="mt-1 text-base font-bold text-zinc-950">예정 참가자</h2>
      {children}
    </section>
  );
}

export function EventParticipantPreview({
  preview,
  previewAnchorId = "participant-preview",
  requiresAuth = false,
  loginHref = "/login",
  viewerId = null,
  viewerWeightClass = null,
  friendUserIds = [],
  visibilityByUserId = {},
}: EventParticipantPreviewProps) {
  if (requiresAuth) {
    return (
      <PreviewShell previewAnchorId={previewAnchorId}>
        <p className="mt-2 text-sm text-zinc-600">로그인하면 참가자 구성을 확인할 수 있습니다.</p>
        <Link
          href={loginHref}
          className="mt-3 inline-block text-xs font-bold text-orange-600 hover:text-orange-700"
        >
          로그인 →
        </Link>
      </PreviewShell>
    );
  }

  if (!preview || preview.total === 0) {
    return (
      <PreviewShell previewAnchorId={previewAnchorId}>
        <p className="mt-2 text-sm text-zinc-500">아직 예정 참가자가 없습니다.</p>
      </PreviewShell>
    );
  }

  if (preview.hidden) {
    return (
      <PreviewShell previewAnchorId={previewAnchorId}>
        <p className="mt-2 text-sm font-semibold text-zinc-800">참가 예정 {preview.total}명</p>
        <EventParticipantGenderAccordion
          genders={preview.genders}
          participants={preview.participants}
          viewerId={viewerId}
          viewerWeightClass={viewerWeightClass}
          friendUserIds={friendUserIds}
          visibilityByUserId={visibilityByUserId}
        />
        <p className="mt-2 text-xs text-zinc-400">3명 이상 모이면 체급·경력 분포가 표시됩니다.</p>
      </PreviewShell>
    );
  }

  const weightEntries = sortCountEntries(preview.weight_classes);
  const backgroundEntries = sortCountEntries(preview.backgrounds);
  const yearEntries = sortCountEntries(preview.experience_years);
  const seekers = preview.sparring_seekers.map((seeker) => {
    const context = getSeekerViewContext(viewerId, seeker.user_id, friendUserIds);
    const visibilitySettings = visibilityByUserId[seeker.user_id];
    const details = formatSeekerDetails(seeker, context, visibilitySettings);
    return { seeker, details };
  });

  return (
    <PreviewShell previewAnchorId={previewAnchorId}>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-800">현재 {preview.total}명</p>
        <p className="text-xs text-zinc-400">이름·연락처 비공개</p>
      </div>

      <EventParticipantGenderAccordion
        genders={preview.genders}
        participants={preview.participants}
        viewerId={viewerId}
        viewerWeightClass={viewerWeightClass}
        friendUserIds={friendUserIds}
        visibilityByUserId={visibilityByUserId}
      />

      <div className="mt-5 space-y-5">
        <CountList title="WEIGHT" entries={weightEntries} />
        <CountList title="EXPERIENCE" entries={yearEntries} />
        <CountList title="BACKGROUND" entries={backgroundEntries} />
      </div>

      {seekers.length > 0 && (
        <div className="mt-6 border-t border-zinc-300 pt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
            LOOKING FOR SPARRING
          </p>
          <ul className="mt-2 divide-y divide-zinc-200 border-y border-zinc-200">
            {seekers.map(({ seeker, details }, index) => (
              <li key={`${seeker.user_id}-${index}`} className="py-2.5 text-sm text-zinc-800">
                <Link
                  href={`/users/${seeker.user_id}`}
                  className="font-bold text-zinc-950 hover:text-orange-700"
                >
                  {seeker.nickname}
                </Link>
                {details && <> · {details}</>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </PreviewShell>
  );
}
