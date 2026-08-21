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
      <section className="border-t border-zinc-200 pt-5">
        <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">MY SCHEDULE</p>
        <h2 className="mt-1 text-lg font-bold text-zinc-950">내 일정</h2>
        <div className="mt-3">
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
      ? scheduleTabHref(scheduleTab)
      : scheduleTabHref("today");

  return (
    <section className="border-t border-zinc-200 pt-5">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">MY SCHEDULE</p>
          <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-zinc-950">내 일정</h2>
        </div>
        {schedule.upcoming.length > 0 && (
          <Link
            href={scheduleHref}
            className="text-xs font-semibold text-zinc-600 hover:text-orange-600"
          >
            캘린더 보기 →
          </Link>
        )}
      </div>

      {highlight ? (
        <Link
          href={`/events/${highlight.eventId}`}
          className="mt-3 block border-l-2 border-orange-600 py-1 pl-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-orange-600">
              {schedule.today.length > 0 ? "TODAY" : formatScheduleCountdown(highlight.eventDate)}
            </p>
            {schedule.thisWeekCount > 1 && (
              <p className="text-xs text-zinc-400">이번 주 {schedule.thisWeekCount}개</p>
            )}
          </div>
          <p className="mt-2 text-sm font-bold text-zinc-950">
            {formatScheduleWhenLabel(highlight.eventDate, highlight.eventTime)}
          </p>
          <p className="mt-1 text-sm text-zinc-600">{highlight.title}</p>
        </Link>
      ) : (
        <div className="mt-3 border-y border-zinc-200 py-4">
          <p className="text-sm text-zinc-500">예정된 참가 일정이 없습니다.</p>
          <Link
            href="/events"
            className="mt-2 inline-block text-xs font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:text-orange-600"
          >
            이벤트 찾기
          </Link>
        </div>
      )}
    </section>
  );
}
