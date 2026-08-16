import { getApprovedCountsByEvent } from "@/lib/queries/event-counts";
import { getEvents } from "@/lib/queries/events";
import type { EventWithGym } from "@/lib/types/database";
import {
  formatNearbyEventLabel,
  getEventRecruitmentStatusForEvent,
  isClosingTodayEvent,
  isRecruitingEventStatus,
  isStartingThisWeekEvent,
  sortNearbyEventItems,
  type HomeEventPreviewItem,
} from "@/lib/utils/home-events";

const PREVIEW_LIMIT = 3;

async function loadRecruitingEvents(
  filters: Parameters<typeof getEvents>[0] = {},
): Promise<HomeEventPreviewItem[]> {
  const { data, error } = await getEvents(filters);

  if (error || !data?.length) return [];

  const countsMap = await getApprovedCountsByEvent(
    data.map((event) => event.id),
  );

  return data
    .map((event) => ({
      event: event as EventWithGym,
      approvedCount: countsMap.get(event.id) ?? 0,
    }))
    .filter(({ event, approvedCount }) =>
      isRecruitingEventStatus(
        getEventRecruitmentStatusForEvent(event, approvedCount),
      ),
    );
}

export async function getHomeRecruitingEvents(limit = 12) {
  const items = await loadRecruitingEvents();

  const sorted = [...items].sort((a, b) => {
    const aClosing = isClosingTodayEvent(a.event, a.approvedCount) ? 0 : 1;
    const bClosing = isClosingTodayEvent(b.event, b.approvedCount) ? 0 : 1;
    if (aClosing !== bClosing) return aClosing - bClosing;

    const aWeek = isStartingThisWeekEvent(a.event, a.approvedCount) ? 0 : 1;
    const bWeek = isStartingThisWeekEvent(b.event, b.approvedCount) ? 0 : 1;
    if (aWeek !== bWeek) return aWeek - bWeek;

    return a.event.event_date.localeCompare(b.event.event_date);
  });

  return sorted.slice(0, limit);
}

export async function getHomeClosingTodayEvents(limit = PREVIEW_LIMIT) {
  const items = await loadRecruitingEvents();
  return items.filter(({ event, approvedCount }) =>
    isClosingTodayEvent(event, approvedCount),
  ).slice(0, limit);
}

export async function getHomeStartingThisWeekEvents(limit = PREVIEW_LIMIT) {
  const items = await loadRecruitingEvents();
  return items
    .filter(
      ({ event, approvedCount }) =>
        isStartingThisWeekEvent(event, approvedCount) &&
        !isClosingTodayEvent(event, approvedCount),
    )
    .slice(0, limit);
}

export async function getHomeNearbyEvents(
  profileRegions: string[],
  limit = PREVIEW_LIMIT,
) {
  const regions = profileRegions.filter((region) => region !== "전국");
  if (!regions.length) {
    return { items: [] as HomeEventPreviewItem[], regions: [] as string[] };
  }

  const items = await loadRecruitingEvents({ nearbyRegions: regions });
  const sorted = sortNearbyEventItems(items, regions).slice(0, limit);

  return {
    items: sorted.map((item) => ({
      ...item,
      nearbyLabel: formatNearbyEventLabel(item.event.region, regions),
    })),
    regions,
  };
}

export async function getHomeNearbyEventsByRegion(
  region: string,
  limit = PREVIEW_LIMIT,
) {
  const trimmed = region.trim();
  if (!trimmed) return [] as HomeEventPreviewItem[];

  const items = await loadRecruitingEvents({ nearbyRegions: [trimmed] });
  return sortNearbyEventItems(items, [trimmed])
    .slice(0, limit)
    .map((item) => ({
      ...item,
      nearbyLabel: formatNearbyEventLabel(item.event.region, [trimmed]),
    }));
}
