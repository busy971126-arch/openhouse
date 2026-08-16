"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  INQUIRY_CATEGORY_OPTIONS,
  INQUIRY_STATUS_LABELS,
  type InquiryCategory,
} from "@/lib/constants/support";
import { Alert } from "@/components/Alert";
import { SignupField, SignupInput } from "@/components/SignupField";

type InquiryItem = {
  id: string;
  category: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
};

type InquirySectionProps = {
  userId: string;
  initialInquiries: InquiryItem[];
};

export function InquirySection({
  userId,
  initialInquiries,
}: InquirySectionProps) {
  const router = useRouter();
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [category, setCategory] = useState<InquiryCategory>(
    INQUIRY_CATEGORY_OPTIONS[0].value,
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const trimmed = message.trim();
    if (!trimmed) {
      setError("문의 내용을 입력해주세요.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("inquiries")
      .insert({
        user_id: userId,
        category,
        message: trimmed,
      })
      .select("id, category, message, status, admin_reply, created_at")
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      setInquiries((prev) => [data, ...prev]);
    }
    setMessage("");
    setSuccess("문의가 접수되었습니다.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">새 문의</h2>
        <div className="mt-4 flex flex-col gap-4">
          <SignupField label="문의 유형" required>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as InquiryCategory)}
              className="rounded-lg border border-zinc-400 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            >
              {INQUIRY_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SignupField>

          <SignupField label="내용" required>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
              placeholder="문의 내용을 입력해주세요"
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
            className="rounded-lg bg-orange-600 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? "접수 중..." : "문의 접수"}
          </button>
        </div>
      </form>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">내 문의 내역</h2>
        {!inquiries.length ? (
          <p className="mt-3 text-sm text-zinc-500">접수한 문의가 없습니다.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {inquiries.map((item) => {
              const categoryLabel =
                INQUIRY_CATEGORY_OPTIONS.find((o) => o.value === item.category)
                  ?.label ?? item.category;

              return (
                <li key={item.id} className="rounded-lg bg-zinc-50 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-zinc-900">{categoryLabel}</p>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {INQUIRY_STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                    {item.message}
                  </p>
                  {item.admin_reply && (
                    <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-zinc-700">
                      <span className="font-medium text-zinc-900">답변: </span>
                      {item.admin_reply}
                    </p>
                  )}
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
