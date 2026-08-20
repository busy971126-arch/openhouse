import Link from "next/link";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { createClient } from "@/lib/supabase/server";
import { getUserHomeSchedule } from "@/lib/queries/home-schedule";
import {
  formatScheduleCountdown,
  formatScheduleWhenLabel,
} from "@/lib/utils/schedule-display";
import { Alert } from "@/components/Alert";
import { scheduleTabHref } from "@/lib/utils/my-schedule";

export function HomeMyScheduleSection() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeMySchedule />
    </Suspense>
  );
}

async function HomeMySchedule() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const scheduleResult = await getUserHomeSchedule(user.id);

  if (scheduleResult.status === "error") {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">📅 내 일정</h2>
        </div>
        <div className="px-4 py-3">
          <Alert message="참가 일정을 불러오지 못했습니다." />
        </div>
      </section>
    );
  }

  const schedule = scheduleResult.data;
  const highlight = schedule.today[0] ?? schedule.next;
  const scheduleTab = schedule.today.length > 0 ? "today" : "week";
  const scheduleHref =
    schedule.upcoming.length > 0
      ? `${scheduleTabHref(scheduleTab)}`
      : scheduleTabHref("today");

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">📅 내 일정</h2>
        {schedule.upcoming.length > 0 && (
          <Link
            href={scheduleHref}
            className="text-xs font-medium text-orange-600 hover:text-orange-700"
          >
            전체 보기 →
          </Link>
        )}
      </div>

      {highlight ? (
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-orange-600">
            {schedule.today.length > 0 ? "오늘" : "다가오는 일정"}
          </p>
          <Link
            href={`/events/${highlight.eventId}`}
            className="mt-2 block rounded-lg hover:bg-zinc-50"
          >
            <p className="text-sm font-semibold text-zinc-900">
              {formatScheduleWhenLabel(highlight.eventDate, highlight.eventTime)}
            </p>
            <p className="mt-0.5 text-sm text-zinc-600">{highlight.title}</p>
          </Link>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
              {formatScheduleCountdown(highlight.eventDate)}
            </span>
            {schedule.thisWeekCount > 1 && (
              <p className="text-xs text-zinc-500">
                이번주 일정 {schedule.thisWeekCount}개
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 py-4">
          <p className="text-sm text-zinc-600">다가오는 참가 일정이 없습니다.</p>
          <Link
            href="/events"
            className="mt-2 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            이벤트 찾기 →
          </Link>
        </div>
      )}
    </section>
  );
}
