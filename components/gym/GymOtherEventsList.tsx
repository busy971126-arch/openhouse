import Link from "next/link";
import { formatEventListDate } from "@/lib/utils/date";

export type GymOtherUpcomingEvent = {
  id: string;
  title: string;
  event_date: string;
};

type GymOtherEventsListProps = {
  events: GymOtherUpcomingEvent[];
  title?: string;
};

export function GymOtherEventsList({
  events,
  title = "다음 예정 이벤트",
}: GymOtherEventsListProps) {
  if (events.length === 0) return null;

  return (
    <div className="mt-5 border-t border-zinc-100 pt-5">
      <p className="text-xs font-medium text-zinc-500">{title}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {events.map((event) => (
          <li key={event.id}>
            <Link
              href={`/events/${event.id}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 text-sm transition hover:border-orange-200 hover:bg-orange-50/40"
            >
              <span className="font-medium text-zinc-900">
                {formatEventListDate(event.event_date)} {event.title}
              </span>
              <span className="shrink-0 text-orange-600">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
