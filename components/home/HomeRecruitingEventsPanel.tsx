"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LoginRequiredPromptButton } from "@/components/auth/LoginRequiredPromptButton";
import {
  EVENT_TYPE_OPTIONS,
  formatEventType,
  type EventType,
} from "@/lib/constants/event-types";
import {
  formatClosingTodayHint,
  getHomeEventBadges,
  isClosingTodayEvent,
  type HomeEventPreviewItem,
} from "@/lib/utils/home-events";
import { formatEventListDate, formatEventTimeDisplay } from "@/lib/utils/date";
import { formatParticipantCount } from "@/lib/utils/event-display";
import { Alert } from "@/components/Alert";

type EventTypeFilter = "all" | EventType;

const FILTER_OPTIONS: { value: EventTypeFilter; label: string }[] = [
  { value: "all", label: "전체" },
  ...EVENT_TYPE_OPTIONS,
];

type HomeRecruitingEventsPanelProps = {
  items: HomeEventPreviewItem[];
  isLoggedIn: boolean;
  error?: boolean;
};

function HomeEventScrollCard({ item }: { item: HomeEventPreviewItem }) {
  const { event, approvedCount } = item;
  const badges = getHomeEventBadges(item);
  const timeLabel = formatEventTimeDisplay(event.event_time);
  const meta = isClosingTodayEvent(item.event, item.approvedCount)
    ? `${event.region} · ${formatClosingTodayHint(event.registration_deadline)}`
    : `${formatEventListDate(event.event_date)}${timeLabel ? ` · ${timeLabel}` : ""} · ${event.region}`;
  const participantLine = formatParticipantCount(
    approvedCount,
    event.max_participants,
  );

  return (
    <Link
      href={`/events/${event.id}`}
      className="flex w-[220px] shrink-0 flex-col rounded-xl border border-zinc-200 bg-white p-3 shadow-sm hover:border-orange-200 hover:bg-orange-50/30"
    >
      <div className="flex flex-wrap items-center gap-1">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
          {formatEventType(event.event_type)}
        </span>
        {badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700"
          >
            {badge}
          </span>
        ))}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-zinc-900">
        {event.title}
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{meta}</p>
      <p className="mt-2 text-xs font-medium text-zinc-600">
        👥 {participantLine}
      </p>
    </Link>
  );
}

export function HomeRecruitingEventsPanel({
  items,
  isLoggedIn,
  error = false,
}: HomeRecruitingEventsPanelProps) {
  const [filter, setFilter] = useState<EventTypeFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.event.event_type === filter);
  }, [filter, items]);

  if (error) {
    return (
      <section className="rounded-xl border border-orange-200 bg-orange-50/60">
        <div className="border-b border-orange-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">🔥 오늘 모집중</h2>
        </div>
        <div className="px-4 py-3">
          <Alert message="이벤트를 불러오지 못했습니다." />
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-orange-200 bg-orange-50/60">
      <div className="flex items-center justify-between gap-2 border-b border-orange-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">🔥 오늘 모집중</h2>
        {isLoggedIn ? (
          <Link
            href="/events"
            className="text-xs font-medium text-orange-600 hover:text-orange-700"
          >
            전체 보기 →
          </Link>
        ) : (
          <LoginRequiredPromptButton
            loginRedirect="/events"
            description="로그인하면 이벤트 전체를 볼 수 있어요."
            className="text-xs font-medium text-orange-600 hover:text-orange-700"
          />
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto px-4 py-3">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === option.value
                ? "bg-orange-600 text-white"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-zinc-500">
          해당 종류의 모집 중 이벤트가 없습니다.
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-4 pb-4">
          {filtered.map((item) => (
            <HomeEventScrollCard key={item.event.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
