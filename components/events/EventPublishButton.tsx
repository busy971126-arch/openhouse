"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/Alert";
import { createClient } from "@/lib/supabase/client";

type EventPublishButtonProps = {
  eventId: string;
  className?: string;
  redirectTo?: string;
};

export function EventPublishButton({
  eventId,
  className = "rounded-lg bg-orange-600 py-3.5 text-center font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50",
  redirectTo,
}: EventPublishButtonProps) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    if (!confirm("이 이벤트를 공개할까요? 공개 후 참가자가 이벤트를 찾고 신청할 수 있습니다.")) {
      return;
    }

    setPublishing(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("events")
      .update({ status: "active", recruitment_closed: false })
      .eq("id", eventId);

    setPublishing(false);

    if (updateError) {
      setError("이벤트를 공개하지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <Alert message={error} />}
      <button
        type="button"
        disabled={publishing}
        onClick={publish}
        className={className}
      >
        {publishing ? "공개 중..." : "이벤트 공개하기"}
      </button>
    </div>
  );
}
