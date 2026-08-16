"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import type { Registration } from "@/lib/types/database";

type CancelButtonProps = {
  registration: Registration;
};

export function CancelButton({ registration }: CancelButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPartyLeader =
    !!registration.party_id &&
    registration.party_representative_user_id === registration.user_id;

  async function handleCancel() {
    const message = isPartyLeader
      ? "동행 신청 전체를 취소하시겠습니까?\n함께 신청한 운동 친구 신청도 모두 취소됩니다."
      : "참가 신청을 취소하시겠습니까?";

    if (!confirm(message)) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase.from("registrations").update({ status: "cancelled" });

    if (
      registration.party_id &&
      user &&
      registration.party_representative_user_id === user.id
    ) {
      query = query.eq("party_id", registration.party_id);
    } else {
      query = query.eq("id", registration.id);
    }

    const { error: updateError } = await query;

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      {isPartyLeader && (
        <p className="mb-2 text-xs text-orange-700">
          동행 신청 대표자입니다. 취소하면 함께 신청한 멤버도 모두 취소됩니다.
        </p>
      )}
      {error && (
        <div className="mb-2">
          <Alert message={error} />
        </div>
      )}
      <button
        type="button"
        onClick={handleCancel}
        disabled={loading}
        className="w-full rounded-lg border border-red-300 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {loading ? "취소 중..." : isPartyLeader ? "동행 신청 전체 취소" : "참가 취소"}
      </button>
    </div>
  );
}
