import type { Event, Gym } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/server";
import { getHostRegistrationCountsByEventIds } from "@/lib/queries/host-registration-stats";
import { getTomorrowDateString, getTodayDateString } from "@/lib/utils/date";
import { getEventRecruitmentStatus, isOperatingEvent } from "@/lib/utils/event-status";
import { PUBLIC_GYM_SELECT } from "@/lib/queries/gym-select";

export type EventRegistrationCounts = {
  approved: number;
  pending: number;
  total: number;
};

export type DashboardEvent = Event & {
  gyms: { name: string; owner_id: string } | null;
  counts: EventRegistrationCounts;
  recruitmentStatus: ReturnType<typeof getEventRecruitmentStatus>;
};

export type DashboardGym = Gym & {
  eventCount: number;
};

export type DashboardData = {
  gyms: DashboardGym[];
  allEvents: DashboardEvent[];
  operatingEvents: DashboardEvent[];
  stats: {
    gymCount: number;
    operatingEventCount: number;
    totalApplications: number;
    pendingApprovals: number;
  };
  todos: {
    pendingApprovals: number;
    tomorrowEvents: number;
  };
};

async function getRegistrationCountsByEvent(
  eventIds: string[],
): Promise<Map<string, EventRegistrationCounts>> {
  const countsMap = await getHostRegistrationCountsByEventIds(eventIds);
  const map = new Map<string, EventRegistrationCounts>();

  for (const id of eventIds) {
    const counts = countsMap.get(id) ?? { approved: 0, pending: 0, total: 0 };
    map.set(id, counts);
  }

  return map;
}

export async function getDashboardData(
  userId: string,
): Promise<{ data: DashboardData | null; error: unknown }> {
  const supabase = await createClient();

  const { data: gyms, error: gymsError } = await supabase
    .from("gyms")
    .select(PUBLIC_GYM_SELECT)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (gymsError) return { data: null, error: gymsError };

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*, gyms!inner(name, owner_id)")
    .eq("gyms.owner_id", userId)
    .order("event_date", { ascending: true });

  if (eventsError) return { data: null, error: eventsError };

  const eventIds = (events ?? []).map((event) => event.id);
  const countsMap = await getRegistrationCountsByEvent(eventIds);

  const tomorrow = getTomorrowDateString();
  let pendingApprovals = 0;
  let totalApplications = 0;

  const dashboardEvents: DashboardEvent[] = (events ?? []).map((event) => {
    const counts = countsMap.get(event.id) ?? {
      approved: 0,
      pending: 0,
      total: 0,
    };
    pendingApprovals += counts.pending;
    totalApplications += counts.total;

    return {
      ...event,
      gyms: event.gyms as { name: string; owner_id: string } | null,
      counts,
      recruitmentStatus: getEventRecruitmentStatus({
        eventDate: event.event_date,
        maxParticipants: event.max_participants,
        approvedCount: counts.total,
        recruitmentClosed: event.recruitment_closed ?? false,
      }),
    };
  });

  const operatingEvents = dashboardEvents.filter((event) =>
    isOperatingEvent(event.event_date),
  );

  const eventCountByGym = new Map<string, number>();
  for (const event of events ?? []) {
    eventCountByGym.set(
      event.gym_id,
      (eventCountByGym.get(event.gym_id) ?? 0) + 1,
    );
  }

  const dashboardGyms: DashboardGym[] = (gyms ?? []).map((gym) => ({
    ...gym,
    eventCount: eventCountByGym.get(gym.id) ?? 0,
  }));

  const tomorrowEvents = operatingEvents.filter(
    (event) => event.event_date === tomorrow,
  ).length;

  return {
    data: {
      gyms: dashboardGyms,
      allEvents: dashboardEvents,
      operatingEvents,
      stats: {
        gymCount: dashboardGyms.length,
        operatingEventCount: operatingEvents.length,
        totalApplications,
        pendingApprovals,
      },
      todos: {
        pendingApprovals,
        tomorrowEvents,
      },
    },
    error: null,
  };
}

export function getRecentNotifications(data: DashboardData): string[] {
  const items: string[] = [];
  const today = getTodayDateString();

  if (data.todos.pendingApprovals > 0) {
    items.push(`승인 대기 ${data.todos.pendingApprovals}명`);
  }

  if (data.todos.tomorrowEvents > 0) {
    items.push(`내일 진행 일정 ${data.todos.tomorrowEvents}개`);
  }

  const newPendingEvents = data.operatingEvents.filter(
    (event) => event.counts.pending > 0 && event.event_date >= today,
  );

  for (const event of newPendingEvents.slice(0, 2)) {
    items.push(
      `${event.title} · 신청 ${event.counts.pending}명 대기 중`,
    );
  }

  return items.slice(0, 4);
}
