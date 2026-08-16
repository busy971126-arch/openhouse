"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import { ParticipantLicenseCard } from "@/components/participants/ParticipantLicenseCard";
import { ParticipantProfileLink } from "@/components/profile/ParticipantProfileLink";
import { HostParticipantStatusActions } from "@/components/host/HostParticipantStatusActions";
import type { ParticipantItem } from "@/lib/utils/participant-items";
import type { RegistrationStatus } from "@/lib/types/database";

type HostParticipantDetailProps = {
  participant: ParticipantItem;
};

export function HostParticipantDetail({
  participant,
}: HostParticipantDetailProps) {
  const router = useRouter();
  const [status, setStatus] = useState<RegistrationStatus>(participant.status);
  const [error, setError] = useState<string | null>(null);
  const [memo, setMemo] = useState(participant.operatorMemo ?? "");
  const [memoSaving, setMemoSaving] = useState(false);

  useEffect(() => {
    setStatus(participant.status);
  }, [participant.status]);

  const contactPhone =
    participant.phone?.trim() || participant.parentPhone?.trim() || null;

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
        status={status}
        autoApproved={participant.autoApproved}
        registrationId={participant.id}
        createdAt={participant.createdAt}
      />

      {participant.userId && status === "approved" && (
        <ParticipantProfileLink
          userId={participant.userId}
          className="flex w-full items-center justify-center rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          프로필 · 운동 친구 요청
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
            placeholder="예정 참가자 메모"
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

      <HostParticipantStatusActions
        registrationId={participant.id}
        initialStatus={participant.status}
        layout="detail"
        showSecondaryActions
        onStatusChange={setStatus}
      />
    </div>
  );
}
