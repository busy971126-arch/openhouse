"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  REPORT_ADMIN_STATUSES,
  type ReportAdminStatus,
} from "@/lib/utils/admin";
import { REPORT_STATUS_LABELS } from "@/lib/constants/support";

type ReportStatusFormProps = {
  reportId: string;
  initialStatus: string;
};

export function ReportStatusForm({
  reportId,
  initialStatus,
}: ReportStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ReportAdminStatus>(
    (REPORT_ADMIN_STATUSES.find((value) => value === initialStatus) ??
      "received") as ReportAdminStatus,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
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
        STATUS
      </p>
      <label className="mt-4 block text-xs font-semibold text-zinc-600">
        처리 상태
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as ReportAdminStatus)
          }
          className="mt-1 w-full border-0 border-b border-zinc-400 bg-transparent px-0 py-2 text-sm text-zinc-950"
        >
          {REPORT_ADMIN_STATUSES.map((value) => (
            <option key={value} value={value}>
              {REPORT_STATUS_LABELS[value] ?? value}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 text-sm font-bold tracking-wide text-zinc-950 underline underline-offset-4 disabled:opacity-50"
      >
        {loading ? "저장 중" : "상태 저장"}
      </button>
    </form>
  );
}
