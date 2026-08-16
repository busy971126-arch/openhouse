import type { DashboardEvent } from "@/lib/queries/dashboard";
import { getTodayDateString } from "@/lib/utils/date";
import { buildHostParticipantsUrl } from "@/lib/utils/host-participants-url";

export function sortHostOperatingEvents(
  events: DashboardEvent[],
): DashboardEvent[] {
  return [...events].sort((a, b) => {
    if (a.counts.pending > 0 && b.counts.pending === 0) return -1;
    if (b.counts.pending > 0 && a.counts.pending === 0) return 1;
    if (a.event_date !== b.event_date) {
      return a.event_date.localeCompare(b.event_date);
    }
    return a.title.localeCompare(b.title, "ko");
  });
}

/** Prefer operating events, then past events with pending approvals. */
export function findHostPendingEvent(
  allEvents: DashboardEvent[],
  today = getTodayDateString(),
): DashboardEvent | undefined {
  const sorted = sortHostOperatingEvents(allEvents);
  const operatingPending = sorted.find(
    (event) => event.event_date >= today && event.counts.pending > 0,
  );
  if (operatingPending) return operatingPending;
  return sorted.find((event) => event.counts.pending > 0);
}

export function splitHostOperatingEvents(
  events: DashboardEvent[],
  today = getTodayDateString(),
) {
  const sorted = sortHostOperatingEvents(events);
  const todayEvents = sorted.filter((event) => event.event_date === today);
  const upcomingEvents = sorted.filter((event) => event.event_date > today);

  return { todayEvents, upcomingEvents };
}

export function getHostParticipantsHref(
  allEvents: DashboardEvent[],
  gyms: { id: string }[],
  today = getTodayDateString(),
): string {
  const pendingEvent = findHostPendingEvent(allEvents, today);
  if (pendingEvent) {
    return buildHostParticipantsUrl(pendingEvent.gym_id, pendingEvent.id);
  }

  const operatingEvents = sortHostOperatingEvents(
    allEvents.filter((event) => event.event_date >= today),
  );
  if (operatingEvents[0]) {
    return buildHostParticipantsUrl(
      operatingEvents[0].gym_id,
      operatingEvents[0].id,
    );
  }
  if (gyms[0]) {
    return `/host/gyms/${gyms[0].id}`;
  }
  return "/host/gyms";
}

export function getHostNewEventHref(gyms: { id: string }[]): string {
  if (gyms[0]) return `/events/new?gym=${gyms[0].id}`;
  return "/host/gyms";
}
