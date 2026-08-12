import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { getApprovedCountsByEvent } from "@/lib/queries/event-counts";
import { getEvents } from "@/lib/queries/events";

const PREVIEW_LIMIT = 3;

export async function HomeUpcomingEvents() {
  const { data: events, error } = await getEvents();

  if (error || !events?.length) {
    return null;
  }

  const countsMap = await getApprovedCountsByEvent(
    events.map((event) => event.id),
  );

  const recruiting = events.filter((event) => {
    const approved = countsMap.get(event.id) ?? 0;
    if (
      event.max_participants != null &&
      event.max_participants > 0 &&
      approved >= event.max_participants
    ) {
      return false;
    }
    return true;
  });

  const preview = recruiting.slice(0, PREVIEW_LIMIT);

  if (preview.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-900">추천 이벤트</h2>
        <Link
          href="/events"
          className="text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          전체 보기 →
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {preview.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            approvedCount={countsMap.get(event.id) ?? 0}
          />
        ))}
      </div>
    </section>
  );
}
