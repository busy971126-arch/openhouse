import Link from "next/link";
import { formatEventListDate, formatEventTimeDisplay } from "@/lib/utils/date";

type HomeEventCompactRowProps = {
  item: HomeEventPreviewItem;
  meta?: string;
  badge?: string;
};

export function HomeEventCompactRow({
  item,
  meta,
  badge,
}: HomeEventCompactRowProps) {
  const { event } = item;
  const timeLabel = formatEventTimeDisplay(event.event_time);

  return (
    <Link
      href={`/events/${event.id}`}
      className="flex items-start justify-between gap-3 rounded-lg px-1 py-2 hover:bg-zinc-50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">
          {event.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {meta ??
            `${formatEventListDate(event.event_date)}${timeLabel ? ` · ${timeLabel}` : ""} · ${event.region}`}
        </p>
      </div>
      {badge && (
        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
          {badge}
        </span>
      )}
    </Link>
  );
}
