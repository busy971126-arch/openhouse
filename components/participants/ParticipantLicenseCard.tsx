import type { ReactNode } from "react";
import {
  formatProfileField,
  formatProfileList,
  getSportEmoji,
} from "@/lib/constants/profile";
import { formatParticipantExperienceSummary } from "@/lib/utils/experience-apply";
import {
  HOST_STATUS_BADGE_CLASS,
  HOST_STATUS_LABELS,
} from "@/lib/utils/host-participant-status";
import { AutoApprovedBadge } from "@/components/participants/AutoApprovedBadge";
import type { RegistrationStatus } from "@/lib/types/database";

export type ParticipantLicenseCardProps = {
  displayName: string | null;
  nickname?: string | null;
  gender?: string | null;
  weightClass: string | null;
  experience: string | null;
  ageGroup?: string | null;
  preferredSports?: string[] | null;
  regions?: string[] | null;
  gymAffiliation?: string | null;
  applicantNotes?: string | null;
  phone?: string | null;
  parentPhone?: string | null;
  seekingSparring?: boolean;
  status?: RegistrationStatus;
  autoApproved?: boolean;
  registrationId?: string;
  createdAt?: string;
  variant?: "full" | "compact";
};

function getInitials(displayName: string | null, nickname?: string | null) {
  const source = nickname?.trim() || displayName?.trim() || "?";
  const chars = [...source];
  if (chars.length >= 2 && /[가-힣]/.test(source)) {
    return chars.slice(0, 2).join("");
  }
  return source.slice(0, 2).toUpperCase();
}

function formatLicenseId(registrationId?: string) {
  if (!registrationId) return null;
  const compact = registrationId.replace(/-/g, "").slice(-8).toUpperCase();
  return `OH-${compact}`;
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-zinc-900">
        {value}
      </p>
    </div>
  );
}

function ContactRow({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-zinc-500">{label}</span>
      <a href={href} className="font-medium text-orange-600 hover:underline">
        {children}
      </a>
    </div>
  );
}

function buildParticipantQuickSummary({
  weightClass,
  experience,
  ageGroup,
  preferredSports,
}: Pick<
  ParticipantLicenseCardProps,
  "weightClass" | "experience" | "ageGroup" | "preferredSports"
>): string {
  const parts = [
    formatProfileField(weightClass),
    formatParticipantExperienceSummary(experience),
    ageGroup ? formatProfileField(ageGroup) : null,
    preferredSports?.length ? formatProfileList(preferredSports) : null,
  ].filter((part) => part && part !== "미입력");

  return parts.join(" · ");
}

export function ParticipantLicenseCard({
  displayName,
  nickname,
  gender,
  weightClass,
  experience,
  ageGroup,
  preferredSports,
  regions,
  gymAffiliation,
  applicantNotes,
  phone,
  parentPhone,
  seekingSparring,
  status,
  autoApproved = false,
  registrationId,
  createdAt,
  variant = "full",
}: ParticipantLicenseCardProps) {
  const name = formatProfileField(displayName);
  const publicName = nickname?.trim() || name;
  const sport = preferredSports?.[0] ?? "유도";
  const sportEmoji = getSportEmoji(sport);
  const experienceSummary = formatParticipantExperienceSummary(experience);
  const licenseId = formatLicenseId(registrationId);
  const initials = getInitials(displayName, nickname);

  const stats = [
    { label: "체급", value: formatProfileField(weightClass) },
    { label: "경력", value: experienceSummary },
    ageGroup ? { label: "나이", value: formatProfileField(ageGroup) } : null,
    {
      label: "종목",
      value: preferredSports?.length
        ? formatProfileList(preferredSports)
        : "미입력",
    },
    (regions?.length ?? 0) > 0
      ? { label: "활동", value: formatProfileList(regions ?? null) }
      : null,
    gender ? { label: "성별", value: formatProfileField(gender) } : null,
    gymAffiliation?.trim()
      ? { label: "소속", value: gymAffiliation.trim() }
      : null,
  ].filter((item): item is { label: string; value: string } => item != null);

  const hasContact = phone || parentPhone;
  const hasFooter = applicantNotes?.trim() || hasContact;

  if (variant === "compact") {
    return (
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {publicName}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {buildParticipantQuickSummary({
                weightClass,
                experience,
                ageGroup,
                preferredSports,
              })}
            </p>
          </div>
          {status && (
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${HOST_STATUS_BADGE_CLASS[status]}`}
              >
                {HOST_STATUS_LABELS[status]}
              </span>
              {autoApproved && status === "approved" && <AutoApprovedBadge />}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-2.5">
        <p className="text-xs font-medium text-zinc-500">예정 참가자 정보</p>
        <div className="flex items-center gap-1.5">
          {autoApproved && status === "approved" && <AutoApprovedBadge />}
          {status && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${HOST_STATUS_BADGE_CLASS[status]}`}
            >
              {HOST_STATUS_LABELS[status]}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-orange-50 text-lg font-bold text-orange-700">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-tight text-zinc-900">
              {publicName}
            </p>
            {nickname?.trim() && displayName?.trim() && nickname !== displayName && (
              <p className="mt-0.5 text-sm text-zinc-500">
                {name}
                <span className="mx-1 text-zinc-300">·</span>
                <span aria-hidden>{sportEmoji}</span> {sport}
              </p>
            )}
            {!nickname?.trim() && (
              <p className="mt-0.5 text-sm text-zinc-500">
                <span aria-hidden>{sportEmoji}</span> {sport}
              </p>
            )}
            {seekingSparring && (
              <span className="mt-2 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                대련 찾는 중
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3 border-t border-zinc-100 pt-4">
          {stats.map((item) => (
            <StatItem key={item.label} label={item.label} value={item.value} />
          ))}
        </div>

        {(licenseId || createdAt) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            {licenseId ? <span>{licenseId}</span> : <span />}
            {createdAt && (
              <span>
                신청{" "}
                {new Date(createdAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {hasFooter && (
        <div className="space-y-2 border-t border-zinc-100 bg-zinc-50 px-4 py-3">
          {applicantNotes?.trim() && (
            <div>
              <p className="text-xs text-zinc-500">요청 사항</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">
                {applicantNotes}
              </p>
            </div>
          )}
          {phone && (
            <ContactRow label="연락처" href={`tel:${phone}`}>
              {phone}
            </ContactRow>
          )}
          {parentPhone && (
            <ContactRow label="보호자" href={`tel:${parentPhone}`}>
              {parentPhone}
            </ContactRow>
          )}
        </div>
      )}
    </div>
  );
}

export { buildParticipantQuickSummary };
