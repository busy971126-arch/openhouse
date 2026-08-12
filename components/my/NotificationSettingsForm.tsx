"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";

type NotificationSettingsFormProps = {
  initialEnabled: boolean;
};

export function NotificationSettingsForm({
  initialEnabled,
}: NotificationSettingsFormProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleToggle() {
    const next = !enabled;
    setLoading(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ notify_new_events: next })
      .eq("id", user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEnabled(next);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-zinc-900">새 일정 알림</p>
          <p className="mt-1 text-sm text-zinc-600">
            관심 지역·종목 또는 관심 체육관에 새 일정이 등록되면 알려드립니다.
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={handleToggle}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
            enabled
              ? "bg-orange-600 text-white"
              : "border border-zinc-300 text-zinc-600"
          }`}
        >
          {enabled ? "켜짐" : "꺼짐"}
        </button>
      </div>
      {error && (
        <div className="mt-3">
          <Alert message={error} />
        </div>
      )}
      {saved && (
        <p className="mt-2 text-xs text-green-700">설정이 저장되었습니다.</p>
      )}
    </div>
  );
}
