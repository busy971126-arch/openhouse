"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import type { RegistrationStatus } from "@/lib/types/database";

type HostParticipantStatusActionsProps = {
  registrationId: string;
  initialStatus: RegistrationStatus;
  layout?: "list" | "detail";
  /** 목록에서는 취소·대기 전환을 숨기고 상세에서만 노출 */
  showSecondaryActions?: boolean;
  onStatusChange?: (status: RegistrationStatus) => void;
};

const buttonBase =
  "rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed";

export function HostParticipantStatusActions({
  registrationId,
  initialStatus,
  layout = "list",
  showSecondaryActions = layout === "detail",
  onStatusChange,
}: HostParticipantStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(initialStatus);

  useEffect(() => {
    setCurrentStatus(initialStatus);
  }, [initialStatus]);

  const isCompact = layout === "list";
  const padding = isCompact ? "py-2" : "py-3";
  const radius = isCompact ? "rounded-lg" : "rounded-xl";

  async function updateStatus(newStatus: RegistrationStatus) {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.rpc("update_registration_status", {
      p_registration_id: registrationId,
      p_status: newStatus,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setCurrentStatus(newStatus);
    onStatusChange?.(newStatus);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <Alert message={error} />}

      {currentStatus === "pending" && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => updateStatus("approved")}
            className={`${buttonBase} ${padding} flex-1 bg-green-600 text-white hover:bg-green-700`}
          >
            참가 확정
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (confirm("참가 신청을 거절하시겠습니까?")) {
                updateStatus("rejected");
              }
            }}
            className={`${buttonBase} ${padding} flex-1 border border-zinc-300 hover:bg-zinc-50`}
          >
            거절
          </button>
        </div>
      )}

      {showSecondaryActions && currentStatus === "pending" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (confirm("참가를 취소 처리하시겠습니까?")) {
              updateStatus("cancelled");
            }
          }}
          className={`${buttonBase} ${padding} w-full border border-red-200 text-red-600 hover:bg-red-50`}
        >
          취소
        </button>
      )}

      {showSecondaryActions && currentStatus === "approved" && (
        <>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (confirm("대기 상태로 전환하시겠습니까?")) {
                updateStatus("pending");
              }
            }}
            className={`${buttonBase} ${padding} w-full border border-zinc-300 hover:bg-zinc-50`}
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
            className={`${buttonBase} ${padding} w-full border border-red-200 text-red-600 hover:bg-red-50`}
          >
            참가 취소
          </button>
        </>
      )}

      {showSecondaryActions &&
        (currentStatus === "cancelled" || currentStatus === "rejected") && (
          <button
            type="button"
            disabled={loading}
            onClick={() => updateStatus("pending")}
            className={`${buttonBase} ${padding} ${radius} w-full border border-zinc-300 hover:bg-zinc-50`}
          >
            대기 전환
          </button>
        )}
    </div>
  );
}
