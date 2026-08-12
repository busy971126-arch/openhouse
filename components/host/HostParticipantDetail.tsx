"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import { ParticipantLicenseCard } from "@/components/participants/ParticipantLicenseCard";
import { ParticipantProfileLink } from "@/components/profile/ParticipantProfileLink";
import type { ParticipantItem } from "@/lib/utils/participant-items";
import type { RegistrationStatus } from "@/lib/types/database";

type HostParticipantDetailProps = {
  participant: ParticipantItem;
};

export function HostParticipantDetail({
  participant,
}: HostParticipantDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(participant.status);
  const [memo, setMemo] = useState(participant.operatorMemo ?? "");
  const [memoSaving, setMemoSaving] = useState(false);

  const contactPhone =
    participant.phone?.trim() || participant.parentPhone?.trim() || null;

  async function updateStatus(newStatus: RegistrationStatus) {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ status: newStatus })
      .eq("id", participant.id);

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
      .eq("id", participant.id);

    setMemoSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <ParticipantLicenseCard
        displayName={participant.displayName}
        nickname={participant.nickname}
        gender={participant.gender}
        weightClass={participant.weightClass}
        experience={participant.experience}
        ageGroup={participant.ageGroup}
        preferredSports={participant.preferredSports}
        regions={participant.regions}
        gymAffiliation={participant.gymAffiliation}
        applicantNotes={participant.applicantNotes}
        phone={participant.phone}
        parentPhone={participant.parentPhone}
        seekingSparring={participant.seekingSparring}
        status={currentStatus}
        registrationId={participant.id}
        createdAt={participant.createdAt}
      />

      {participant.userId && participant.status === "approved" && (
        <ParticipantProfileLink
          userId={participant.userId}
          className="flex w-full items-center justify-center rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          프로필 · 친구 추가
        </ParticipantProfileLink>
      )}

      {contactPhone && (
        <a
          href={`tel:${contactPhone}`}
          className="flex w-full items-center justify-center rounded-xl border border-orange-200 bg-orange-50 py-3 text-sm font-semibold text-orange-800 hover:bg-orange-100"
        >
          연락하기
        </a>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
        <label className="block text-xs text-zinc-500">
          메모
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            placeholder="참가자 메모"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={memoSaving}
          onClick={saveMemo}
          className="mt-2 w-full rounded-lg border border-zinc-300 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
        >
          {memoSaving ? "저장 중..." : "메모 저장"}
        </button>
      </div>

      {error && <Alert message={error} />}

      {currentStatus === "pending" && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => updateStatus("approved")}
            className="rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            참가 승인
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (confirm("참가를 취소 처리하시겠습니까?")) {
                updateStatus("cancelled");
              }
            }}
            className="rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            참가 취소
          </button>
        </div>
      )}

      {currentStatus === "approved" && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (confirm("대기 상태로 전환하시겠습니까?")) {
                updateStatus("pending");
              }
            }}
            className="rounded-xl border border-zinc-300 py-3 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
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
            className="rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            참가 취소
          </button>
        </div>
      )}

      {(currentStatus === "cancelled" || currentStatus === "rejected") && (
        <button
          type="button"
          disabled={loading}
          onClick={() => updateStatus("pending")}
          className="rounded-xl border border-zinc-300 py-3 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
        >
          대기 전환
        </button>
      )}
    </div>
  );
}
