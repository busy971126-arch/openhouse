"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
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
      className="flex w-[230px] shrink-0 flex-col border border-zinc-200 bg-white p-3.5 transition hover:border-zinc-400"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
          {formatEventType(event.event_type)}
        </span>
        {badges.map((badge) => (
          <span
            key={badge}
            className="border-l border-orange-300 pl-1.5 text-[10px] font-bold text-orange-700"
          >
            {badge}
          </span>
        ))}
      </div>
      <p className="mt-3 line-clamp-2 text-[15px] font-bold leading-5 text-zinc-950">
        {event.title}
      </p>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{meta}</p>
      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
        <AppIcon name="users" className="size-3.5" />
        <span>{participantLine}</span>
      </div>
    </Link>
  );
}

function SectionHeading() {
  return (
    <div>
      <p className="text-[10px] font-black tracking-[0.18em] text-orange-600">NOW OPEN</p>
      <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-zinc-950">지금 모집중</h2>
    </div>
  );
}

export function HomeRecruitingEventsPanel({
  items,
  error = false,
}: HomeRecruitingEventsPanelProps) {
  const [filter, setFilter] = useState<EventTypeFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.event.event_type === filter);
  }, [filter, items]);

  if (error) {
    return (
      <section className="border-t border-zinc-200 pt-5">
        <SectionHeading />
        <div className="mt-3">
          <Alert message="이벤트를 불러오지 못했습니다." />
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="border-t border-zinc-200 pt-5">
      <div className="flex items-end justify-between gap-2">
        <SectionHeading />
        <Link
          href="/events"
          className="text-xs font-semibold text-zinc-600 hover:text-orange-600"
        >
          전체 보기 →
        </Link>
      </div>

      <div className="mt-4 flex gap-4 overflow-x-auto border-b border-zinc-200 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            className={`shrink-0 pb-1 text-xs font-semibold transition ${
              filter === option.value
                ? "border-b-2 border-orange-600 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-5 text-sm text-zinc-500">해당 종류의 모집 중 이벤트가 없습니다.</p>
      ) : (
        <div className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filtered.map((item) => (
            <HomeEventScrollCard key={item.event.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
