"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import type { Event } from "@/lib/types/database";

type EventManageActionsProps = {
  event: Pick<
    Event,
    | "id"
    | "gym_id"
    | "created_by"
    | "title"
    | "description"
    | "event_type"
    | "sport"
    | "region"
    | "address"
    | "event_date"
    | "event_time"
    | "recurring_days"
    | "max_participants"
    | "recruitment_closed"
    | "fee_amount"
    | "registration_deadline"
    | "difficulty"
    | "status"
  >;
  variant?: "inline" | "panel";
  className?: string;
};

export function EventManageActions({
  event,
  variant = "panel",
  className = "",
}: EventManageActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lifecycleStatus = event.status ?? "active";
  const isDraft = lifecycleStatus === "draft";
  const isActive = lifecycleStatus === "active";
  const isCancelled = lifecycleStatus === "cancelled";

  async function toggleRecruitment() {
    if (!isActive) return;

    setLoading("recruitment");
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("events")
      .update({ recruitment_closed: !event.recruitment_closed })
      .eq("id", event.id)
      .eq("status", "active");

    setLoading(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  }

  async function duplicateEvent() {
    if (!confirm("이 일정을 복제하시겠습니까? 복사본은 비공개 초안으로 저장됩니다.")) return;

    setLoading("duplicate");
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("events").insert({
      gym_id: event.gym_id,
      created_by: event.created_by,
      title: `${event.title} (복사)`,
      event_type: event.event_type ?? "open_mat",
      description: event.description,
      sport: event.sport,
      region: event.region,
      address: event.address,
      event_date: event.event_date,
      event_time: event.event_time,
      recurring_days: event.recurring_days,
      max_participants: event.max_participants,
      fee_amount: event.fee_amount,
      registration_deadline: event.registration_deadline,
      difficulty: event.difficulty,
      recruitment_closed: false,
      status: "draft",
    });

    setLoading(null);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.refresh();
  }

  async function cancelEvent() {
    if (!isActive) return;

    if (
      !confirm(
        "이벤트를 취소하시겠습니까? 참가자에게 취소 상태가 반영되고 더 이상 신청을 받지 않습니다.",
      )
    ) {
      return;
    }

    setLoading("cancel");
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("events")
      .update({ status: "cancelled", recruitment_closed: true })
      .eq("id", event.id)
      .eq("status", "active");

    setLoading(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.refresh();
  }

  async function deleteDraft() {
    if (!isDraft) return;

    if (!confirm("이 비공개 초안을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.")) {
      return;
    }

    setLoading("delete");
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", event.id)
      .eq("status", "draft");

    setLoading(null);

    if (deleteError) {
      setError("초안을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    router.push(`/host/gyms/${event.gym_id}/events`);
    router.refresh();
  }

  const recruitmentLabel = event.recruitment_closed ? "모집 재개" : "모집 마감";
  const linkClass =
    variant === "inline"
      ? "text-zinc-500 hover:text-orange-600 disabled:opacity-50"
      : "rounded-lg border border-zinc-200 bg-white py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50";

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {error && <Alert message={error} />}

      {variant === "inline" ? (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium">
          <Link href={`/events/${event.id}/edit`} className={linkClass}>
            수정
          </Link>
          <span className="text-zinc-300">·</span>
          <button
            type="button"
            disabled={loading !== null}
            onClick={duplicateEvent}
            className={linkClass}
          >
            {loading === "duplicate" ? "복제 중..." : "복제"}
          </button>

          {isActive && (
            <>
              <span className="text-zinc-300">·</span>
              <button
                type="button"
                disabled={loading !== null}
                onClick={toggleRecruitment}
                className={linkClass}
              >
                {loading === "recruitment" ? "처리 중..." : recruitmentLabel}
              </button>
              <span className="text-zinc-300">·</span>
              <button
                type="button"
                disabled={loading !== null}
                onClick={cancelEvent}
                className="text-amber-600 hover:text-amber-700 disabled:opacity-50"
              >
                {loading === "cancel" ? "취소 중..." : "이벤트 취소"}
              </button>
            </>
          )}

          {isDraft && (
            <>
              <span className="text-zinc-300">·</span>
              <button
                type="button"
                disabled={loading !== null}
                onClick={deleteDraft}
                className="text-red-500 hover:text-red-600 disabled:opacity-50"
              >
                {loading === "delete" ? "삭제 중..." : "초안 삭제"}
              </button>
            </>
          )}

          {isCancelled && (
            <>
              <span className="text-zinc-300">·</span>
              <span className="text-zinc-400">취소된 이벤트 · 기록 보관</span>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/events/${event.id}/edit`}
            className={`col-span-1 text-center ${linkClass}`}
          >
            수정
          </Link>
          <button
            type="button"
            disabled={loading !== null}
            onClick={duplicateEvent}
            className={linkClass}
          >
            {loading === "duplicate" ? "복제 중..." : "복제"}
          </button>

          {isActive && (
            <>
              <button
                type="button"
                disabled={loading !== null}
                onClick={toggleRecruitment}
                className={`col-span-2 ${linkClass}`}
              >
                {loading === "recruitment" ? "처리 중..." : recruitmentLabel}
              </button>
              <button
                type="button"
                disabled={loading !== null}
                onClick={cancelEvent}
                className={`col-span-2 ${linkClass} text-amber-700 hover:bg-amber-50`}
              >
                {loading === "cancel" ? "취소 중..." : "이벤트 취소"}
              </button>
            </>
          )}

          {isDraft && (
            <button
              type="button"
              disabled={loading !== null}
              onClick={deleteDraft}
              className={`col-span-2 ${linkClass} text-red-600 hover:bg-red-50`}
            >
              {loading === "delete" ? "삭제 중..." : "초안 삭제"}
            </button>
          )}

          {isCancelled && (
            <p className="col-span-2 rounded-lg bg-zinc-50 px-3 py-2 text-center text-xs text-zinc-500">
              취소된 이벤트는 참가 기록 보존을 위해 삭제하지 않습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
