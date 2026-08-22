"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  INQUIRY_ADMIN_STATUSES,
  type InquiryAdminStatus,
} from "@/lib/utils/admin";
import { INQUIRY_STATUS_LABELS } from "@/lib/constants/support";

type InquiryReplyFormProps = {
  inquiryId: string;
  initialStatus: string;
  initialReply: string | null;
};

export function InquiryReplyForm({
  inquiryId,
  initialStatus,
  initialReply,
}: InquiryReplyFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<InquiryAdminStatus>(
    (INQUIRY_ADMIN_STATUSES.find((value) => value === initialStatus) ??
      "open") as InquiryAdminStatus,
  );
  const [reply, setReply] = useState(initialReply ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminReply: reply }),
    });

    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    setLoading(false);

    if (!response.ok) {
      setError(body?.error ?? "저장하지 못했습니다.");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 border-t border-zinc-300 pt-6">
      <p className="text-[10px] font-black tracking-[0.16em] text-zinc-400">
        REPLY
      </p>
      <label className="mt-4 block text-xs font-semibold text-zinc-600">
        상태
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as InquiryAdminStatus)
          }
          className="mt-1 w-full border-0 border-b border-zinc-400 bg-transparent px-0 py-2 text-sm text-zinc-950"
        >
          {INQUIRY_ADMIN_STATUSES.map((value) => (
            <option key={value} value={value}>
              {INQUIRY_STATUS_LABELS[value] ?? value}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-5 block text-xs font-semibold text-zinc-600">
        답변
        <textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          rows={6}
          className="mt-1 w-full border-0 border-b border-zinc-400 bg-transparent px-0 py-2 text-sm leading-6 text-zinc-950"
        />
      </label>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 text-sm font-bold tracking-wide text-zinc-950 underline underline-offset-4 disabled:opacity-50"
      >
        {loading ? "저장 중" : "처리 저장"}
      </button>
    </form>
  );
}
