"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import {
  canCancelRegistration,
  getRegistrationDisplayStatus,
  REGISTRATION_STATUS_DISPLAY,
} from "@/lib/utils/registration-status";
import { formatEventType } from "@/lib/constants/event-types";
import {
  formatEventDate,
  formatEventTimeDisplay,
} from "@/lib/utils/date";
import {
  formatScheduleCountdown,
  formatScheduleWhenLabel,
} from "@/lib/utils/schedule-display";
import type { RegistrationStatus } from "@/lib/types/database";

type MyRegistrationCardProps = {
  registrationId: string;
  eventId: string;
  status: RegistrationStatus;
  cancelledByEvent?: boolean;
  title: string;
  eventDate: string;
  eventTime?: string | null;
  eventType?: string;
  sport: string;
  region: string;
  emphasizeToday?: boolean;
};

export function MyRegistrationCard({
  registrationId,
  eventId,
  status,
  cancelledByEvent = false,
  title,
  eventDate,
  eventTime,
  eventType,
  sport,
  region,
  emphasizeToday = false,
}: MyRegistrationCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(status);

  const displayStatus = getRegistrationDisplayStatus(
    currentStatus,
    eventDate,
    cancelledByEvent,
  );
  const statusInfo = REGISTRATION_STATUS_DISPLAY[displayStatus];
  const canCancel = canCancelRegistration(currentStatus, eventDate);
  const whenLabel = formatScheduleWhenLabel(eventDate, eventTime);
  const timeLabel = formatEventTimeDisplay(eventTime);

  async function handleCancel() {
    if (
      !confirm(
        "참가 신청을 취소하시겠습니까?\n취소하면 정원이 다시 열립니다.",
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ status: "cancelled" })
      .eq("id", registrationId);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setCurrentStatus("cancelled");
    router.refresh();
  }

  return (
    <li
      className={`rounded-xl border bg-white p-4 ${
        emphasizeToday ? "border-orange-200 shadow-sm" : "border-zinc-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/events/${eventId}`} className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900">{title}</p>
          <p className="mt-1 text-sm font-medium text-zinc-800">{whenLabel}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {formatEventType(eventType)} · {formatEventDate(eventDate)}
            {timeLabel && !whenLabel.includes(timeLabel)
              ? ` · ${timeLabel}`
              : ""}{" "}
            · {sport} · {region}
          </p>
        </Link>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`text-xs font-medium ${statusInfo.className}`}>
            {statusInfo.emoji} {statusInfo.label}
          </span>
          {emphasizeToday && currentStatus !== "cancelled" && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
              {formatScheduleCountdown(eventDate)}
            </span>
          )}
        </div>
      </div>

      {cancelledByEvent && currentStatus === "cancelled" && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          운영자가 이벤트를 취소했습니다. 일정에서 상태를 확인해주세요.
        </p>
      )}

      {error && (
        <div className="mt-3">
          <Alert message={error} />
        </div>
      )}

      {canCancel && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="mt-3 w-full rounded-lg border border-red-200 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {loading ? "취소 중..." : "참가 취소"}
        </button>
      )}
    </li>
  );
}
