"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  REPORT_CATEGORY_OPTIONS,
  REPORT_STATUS_LABELS,
  type ReportCategory,
} from "@/lib/constants/support";
import { Alert } from "@/components/Alert";
import { SignupField } from "@/components/SignupField";

type ReportItem = {
  id: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
  event_id: string | null;
  reported_user_id: string | null;
};

type ReportSectionProps = {
  userId: string;
  initialReports: ReportItem[];
  defaultEventId?: string | null;
  defaultReportedUserId?: string | null;
  eventTitle?: string | null;
  reportedUserLabel?: string | null;
};

export function ReportSection({
  userId,
  initialReports,
  defaultEventId = null,
  defaultReportedUserId = null,
  eventTitle = null,
  reportedUserLabel = null,
}: ReportSectionProps) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [category, setCategory] = useState<ReportCategory>(
    REPORT_CATEGORY_OPTIONS[0].value,
  );
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasTarget = Boolean(defaultEventId || defaultReportedUserId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const trimmed = description.trim();
    if (!trimmed) {
      setError("신고 내용을 입력해주세요.");
      setLoading(false);
      return;
    }

    if (!hasTarget) {
      setError("신고 대상(이벤트 또는 사용자)이 필요합니다.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("reports")
      .insert({
        reporter_id: userId,
        reported_user_id: defaultReportedUserId,
        event_id: defaultEventId,
        category,
        description: trimmed,
      })
      .select("id, category, description, status, created_at, event_id, reported_user_id")
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      setReports((prev) => [data, ...prev]);
    }
    setDescription("");
    setSuccess("신고가 접수되었습니다.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">신고 접수</h2>
        {(eventTitle || reportedUserLabel) && (
          <p className="mt-2 text-sm text-zinc-600">
            {eventTitle && <>이벤트: {eventTitle}</>}
            {eventTitle && reportedUserLabel && " · "}
            {reportedUserLabel && <>대상: {reportedUserLabel}</>}
          </p>
        )}

        {!hasTarget ? (
          <p className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            신고는 이벤트 상세 페이지에서 접수할 수 있습니다. 아래에서 이전
            신고 내역을 확인하세요.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <SignupField label="신고 유형" required>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className="rounded-lg border border-zinc-400 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              >
                {REPORT_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </SignupField>

            <SignupField label="상세 내용" required>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
                placeholder="신고 사유를 구체적으로 적어주세요"
                className="rounded-lg border border-zinc-400 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </SignupField>

            {error && <Alert message={error} />}
            {success && (
              <p className="text-sm text-green-700" role="status">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "접수 중..." : "신고 접수"}
            </button>
          </form>
        )}
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">내 신고 내역</h2>
        {!reports.length ? (
          <p className="mt-3 text-sm text-zinc-500">접수한 신고가 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reports.map((item) => {
              const categoryLabel =
                REPORT_CATEGORY_OPTIONS.find((o) => o.value === item.category)
                  ?.label ?? item.category;

              return (
                <li key={item.id} className="rounded-lg bg-zinc-50 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-zinc-900">{categoryLabel}</p>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {REPORT_STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                    {item.description}
                  </p>
                  <time className="mt-2 block text-xs text-zinc-400">
                    {new Date(item.created_at).toLocaleString("ko-KR")}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
