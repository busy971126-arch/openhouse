"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatProfileField } from "@/lib/constants/profile";
import { formatParticipantExperienceSummary } from "@/lib/utils/experience-apply";
import type { ParticipantPartyGroup } from "@/lib/utils/participant-party";
import { Alert } from "@/components/Alert";
import { ParticipantLicenseCard } from "@/components/participants/ParticipantLicenseCard";
import { AutoApprovedBadge } from "@/components/participants/AutoApprovedBadge";
import { ParticipantPartyBadge } from "@/components/participants/ParticipantPartyBadge";
import { ParticipantProfileLink } from "@/components/profile/ParticipantProfileLink";
import type { RegistrationStatus } from "@/lib/types/database";

const statusLabels: Record<RegistrationStatus, string> = {
  pending: "대기",
  approved: "확정",
  rejected: "거절",
  cancelled: "취소",
};

type RegistrationRowProps = {
  id: string;
  userId?: string | null;
  displayName: string | null;
  nickname?: string | null;
  gender: string | null;
  ageGroup: string | null;
  weightClass: string | null;
  experience: string | null;
  gymAffiliation?: string | null;
  applicantNotes?: string | null;
  seekingSparring?: boolean;
  phone: string | null;
  parentPhone: string | null;
  regions: string[] | null;
  preferredSports: string[] | null;
  status: RegistrationStatus;
  autoApproved?: boolean;
  operatorMemo?: string | null;
  createdAt: string;
  isOwner: boolean;
  showPhoneInSummary?: boolean;
  partyGroup?: ParticipantPartyGroup;
};

export function RegistrationRow({
  id,
  userId,
  displayName,
  nickname,
  gender,
  ageGroup,
  weightClass,
  experience,
  gymAffiliation,
  applicantNotes,
  seekingSparring,
  phone,
  parentPhone,
  regions,
  preferredSports,
  status,
  autoApproved = false,
  operatorMemo,
  createdAt,
  isOwner,
  showPhoneInSummary = false,
  partyGroup,
}: RegistrationRowProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [memo, setMemo] = useState(operatorMemo ?? "");
  const [memoSaving, setMemoSaving] = useState(false);

  const contactPhone = phone?.trim() || parentPhone?.trim() || null;
  const experienceSummary = formatParticipantExperienceSummary(experience);
  const displayLabel = formatProfileField(displayName);
  const canViewProfile = Boolean(userId) && currentStatus === "approved";

  async function updateStatus(newStatus: RegistrationStatus) {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.rpc("update_registration_status", {
      p_registration_id: id,
      p_status: newStatus,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setCurrentStatus(newStatus);
    router.refresh();
  }

  async function saveMemo() {
    setMemoSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ operator_memo: memo.trim() || null })
      .eq("id", id);

    setMemoSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  }

  return (
    <li className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900">
            {canViewProfile ? (
              <Link
                href={`/users/${userId}`}
                className="hover:text-orange-600"
              >
                {displayLabel}
              </Link>
            ) : (
              displayLabel
            )}
          </p>
          <p className="mt-1 text-sm text-zinc-700">
            {formatProfileField(weightClass)} · {experienceSummary} ·{" "}
            {formatProfileField(gender)}
          </p>
          {seekingSparring && (
            <span className="mt-2 inline-block rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
              대련 찾기
            </span>
          )}
          {partyGroup && partyGroup.companions.length > 0 && (
            <ParticipantPartyBadge group={partyGroup} />
          )}
          {showPhoneInSummary && contactPhone && (
            <p className="mt-1 text-sm text-zinc-500">{contactPhone}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium">
            {statusLabels[currentStatus]}
          </span>
          {autoApproved && currentStatus === "approved" && <AutoApprovedBadge />}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="mt-3 w-full rounded-lg py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
        aria-expanded={expanded}
      >
        {expanded ? "상세 정보 접기" : "상세보기"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-zinc-100 pt-3">
          <ParticipantLicenseCard
            displayName={displayName}
            nickname={nickname}
            gender={gender}
            weightClass={weightClass}
            experience={experience}
            ageGroup={ageGroup}
            preferredSports={preferredSports}
            regions={regions}
            gymAffiliation={gymAffiliation}
            applicantNotes={applicantNotes}
            phone={phone}
            parentPhone={parentPhone}
            seekingSparring={seekingSparring}
            status={currentStatus}
            autoApproved={autoApproved}
            registrationId={id}
            createdAt={createdAt}
          />

          {canViewProfile && (
            <ParticipantProfileLink
              userId={userId}
              className="flex w-full items-center justify-center rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              프로필 · 운동 친구 요청
            </ParticipantProfileLink>
          )}

          {isOwner && contactPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="flex w-full items-center justify-center rounded-lg border border-orange-200 bg-orange-50 py-2 text-sm font-medium text-orange-800 hover:bg-orange-100"
            >
              연락하기
            </a>
          )}

          {isOwner && (
            <div className="space-y-2">
              <label className="block text-xs text-zinc-500">
                메모
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={2}
                  placeholder="예정 참가자 메모"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="button"
                disabled={memoSaving}
                onClick={saveMemo}
                className="w-full rounded-lg border border-zinc-300 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50"
              >
                {memoSaving ? "저장 중..." : "메모 저장"}
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2">
          <Alert message={error} />
        </div>
      )}

      {isOwner && currentStatus === "pending" && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => updateStatus("approved")}
            className="flex-1 rounded-lg bg-green-600 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            참가 확정
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => updateStatus("rejected")}
            className="flex-1 rounded-lg border border-zinc-300 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50"
          >
            거절
          </button>
        </div>
      )}

      {isOwner && currentStatus === "approved" && (
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (confirm("승인을 취소하고 대기 상태로 되돌릴까요?")) {
                updateStatus("pending");
              }
            }}
            className="rounded-lg border border-zinc-300 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50"
          >
            대기 전환
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (confirm("참가를 취소 처리하시겠습니까?")) {
                updateStatus("cancelled");
              }
            }}
            className="rounded-lg border border-red-200 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            참가 취소
          </button>
        </div>
      )}
    </li>
  );
}
