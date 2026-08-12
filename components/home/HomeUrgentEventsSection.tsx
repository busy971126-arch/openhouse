import Link from "next/link";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { HomeEventCompactRow } from "@/components/home/HomeEventCompactRow";
import {
  getHomeClosingTodayEvents,
  getHomeStartingThisWeekEvents,
} from "@/lib/queries/home-events";
import { formatClosingTodayHint } from "@/lib/utils/home-events";
import { formatEventListDate, formatEventTimeDisplay } from "@/lib/utils/date";

export function HomeUrgentEventsSection() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeUrgentEvents />
    </Suspense>
  );
}

async function HomeUrgentEvents() {
  const [closingToday, startingThisWeek] = await Promise.all([
    getHomeClosingTodayEvents(3),
    getHomeStartingThisWeekEvents(3),
  ]);

  if (closingToday.length === 0 && startingThisWeek.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-orange-200 bg-orange-50/60">
      <div className="flex items-center justify-between gap-2 border-b border-orange-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">🔥 지금 모집 중</h2>
        <Link
          href="/events"
          className="text-xs font-medium text-orange-600 hover:text-orange-700"
        >
          전체 보기 →
        </Link>
      </div>

      <div className="space-y-4 px-4 py-3">
        {closingToday.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-orange-700">오늘 마감</p>
            <div className="mt-1 divide-y divide-orange-100">
              {closingToday.map((item) => (
                <HomeEventCompactRow
                  key={item.event.id}
                  item={item}
                  meta={`${item.event.region} · ${formatClosingTodayHint(item.event.registration_deadline)}`}
                  badge="오늘 마감"
                />
              ))}
            </div>
          </div>
        )}

        {startingThisWeek.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-600">이번주 시작</p>
            <div className="mt-1 divide-y divide-orange-100">
              {startingThisWeek.map((item) => {
                const timeLabel = formatEventTimeDisplay(item.event.event_time);
                return (
                  <HomeEventCompactRow
                    key={item.event.id}
                    item={item}
                    meta={`${formatEventListDate(item.event.event_date)}${timeLabel ? ` · ${timeLabel}` : ""} · ${item.event.region}`}
                    badge="이번주"
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
