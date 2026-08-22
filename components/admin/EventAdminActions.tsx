"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EventAdminAction } from "@/lib/utils/admin";
import { ADMIN_REASON_MAX_LENGTH } from "@/lib/admin/validation";

type EventAdminActionsProps = {
  eventId: string;
  isHidden: boolean;
  isPaused: boolean;
};

const ACTIONS: Array<{
  action: EventAdminAction;
  label: string;
  impact: string;
  showWhen: (state: { isHidden: boolean; isPaused: boolean }) => boolean;
}> = [
  {
    action: "event.hide",
    label: "공개 숨김",
    impact: "공개 목록과 공개 상세에서 사라집니다. 호스트는 계속 관리할 수 있습니다.",
    showWhen: ({ isHidden }) => !isHidden,
  },
  {
    action: "event.restore",
    label: "공개 복구",
    impact: "체육관이 공개이고 draft가 아니면 다시 공개됩니다.",
    showWhen: ({ isHidden }) => isHidden,
  },
  {
    action: "event.recruitment_pause",
    label: "신청 중지",
    impact: "신규 신청을 받지 않습니다. 기존 신청은 유지됩니다.",
    showWhen: ({ isPaused }) => !isPaused,
  },
  {
    action: "event.recruitment_resume",
    label: "신청 재개",
    impact: "호스트 마감·정원 등 다른 조건이 없으면 다시 신청할 수 있습니다.",
    showWhen: ({ isPaused }) => isPaused,
  },
];

export function EventAdminActions({
  eventId,
  isHidden,
  isPaused,
}: EventAdminActionsProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<EventAdminAction | null>(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = ACTIONS.find((item) => item.action === selected);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/admin/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: selected, reason }),
    });

    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    setLoading(false);

    if (!response.ok) {
      setError(body?.error ?? "처리하지 못했습니다.");
      return;
    }

    setSelected(null);
    setReason("");
    setConfirmed(false);
    router.refresh();
  }

  return (
    <section className="mt-10 border-t border-zinc-300 pt-6">
      <p className="text-[10px] font-black tracking-[0.16em] text-orange-600">
        ADMIN ACTIONS
      </p>
      <div className="mt-4 flex flex-wrap gap-4">
        {ACTIONS.filter((item) => item.showWhen({ isHidden, isPaused })).map(
          (item) => (
            <button
              key={item.action}
              type="button"
              onClick={() => {
                setSelected(item.action);
                setConfirmed(false);
                setError(null);
              }}
              className="text-sm font-bold tracking-wide text-zinc-950 underline underline-offset-4"
            >
              {item.label}
            </button>
          ),
        )}
      </div>

      {current && (
        <form onSubmit={handleSubmit} className="mt-6">
          <p className="text-sm text-zinc-700">{current.impact}</p>
          <label className="mt-4 block text-xs font-semibold text-zinc-600">
            사유
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={ADMIN_REASON_MAX_LENGTH}
              rows={3}
              required
              className="mt-1 w-full border-0 border-b border-zinc-400 bg-transparent px-0 py-2 text-sm leading-6 text-zinc-950"
            />
          </label>
          <label className="mt-4 flex items-start gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1"
            />
            영향을 확인했습니다.
          </label>
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          <div className="mt-5 flex gap-4">
            <button
              type="submit"
              disabled={loading || !confirmed}
              className="text-sm font-bold tracking-wide text-orange-600 underline underline-offset-4 disabled:opacity-50"
            >
              {loading ? "처리 중" : current.label}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setReason("");
                setConfirmed(false);
                setError(null);
              }}
              className="text-sm font-semibold text-zinc-500"
            >
              취소
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
