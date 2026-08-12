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

  async function handleCancel() {
    if (!confirm("참가 신청을 취소하시겠습니까?")) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ status: "cancelled" })
      .eq("id", registration.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  }

  return (
    <div>
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
        {loading ? "취소 중..." : "참가 취소"}
      </button>
    </div>
  );
}
