import { getApprovedCountsByEvent } from "@/lib/queries/event-counts";
import { getEvents } from "@/lib/queries/events";
import type { EventWithGym } from "@/lib/types/database";
import { getApprovedCountFromResult } from "@/lib/utils/event-counts-map";
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

export type HomeEventsLoadResult = {
  error: boolean;
  items: HomeEventPreviewItem[];
};

async function loadRecruitingEvents(
  filters: Parameters<typeof getEvents>[0] = {},
): Promise<HomeEventsLoadResult> {
  const { data, error } = await getEvents(filters);

  if (error) return { error: true, items: [] };
  if (!data?.length) return { error: false, items: [] };

  const countsResult = await getApprovedCountsByEvent(
    data.map((event) => event.id),
  );

  const items = data
    .map((event) => ({
      event: event as EventWithGym,
      approvedCount: getApprovedCountFromResult(countsResult, event.id),
    }))
    .filter(({ event, approvedCount }) =>
      isRecruitingEventStatus(
        getEventRecruitmentStatusForEvent(event, approvedCount),
      ),
    );

  return { error: false, items };
}

export async function getHomeRecruitingEvents(
  limit = 12,
): Promise<HomeEventsLoadResult> {
  const loaded = await loadRecruitingEvents();
  if (loaded.error) return loaded;

  const sorted = [...loaded.items].sort((a, b) => {
    const aClosing = isClosingTodayEvent(a.event, a.approvedCount) ? 0 : 1;
    const bClosing = isClosingTodayEvent(b.event, b.approvedCount) ? 0 : 1;
    if (aClosing !== bClosing) return aClosing - bClosing;

    const aWeek = isStartingThisWeekEvent(a.event, a.approvedCount) ? 0 : 1;
    const bWeek = isStartingThisWeekEvent(b.event, b.approvedCount) ? 0 : 1;
    if (aWeek !== bWeek) return aWeek - bWeek;

    return a.event.event_date.localeCompare(b.event.event_date);
  });

  return { error: false, items: sorted.slice(0, limit) };
}

export async function getHomeClosingTodayEvents(limit = PREVIEW_LIMIT) {
  const loaded = await loadRecruitingEvents();
  if (loaded.error) return loaded;
  return {
    error: false,
    items: loaded.items
      .filter(({ event, approvedCount }) =>
        isClosingTodayEvent(event, approvedCount),
      )
      .slice(0, limit),
  };
}

export async function getHomeStartingThisWeekEvents(limit = PREVIEW_LIMIT) {
  const loaded = await loadRecruitingEvents();
  if (loaded.error) return loaded;
  return {
    error: false,
    items: loaded.items
      .filter(
        ({ event, approvedCount }) =>
          isStartingThisWeekEvent(event, approvedCount) &&
          !isClosingTodayEvent(event, approvedCount),
      )
      .slice(0, limit),
  };
}

export async function getHomeNearbyEvents(
  profileRegions: string[],
  limit = PREVIEW_LIMIT,
) {
  const regions = profileRegions.filter((region) => region !== "전국");
  if (!regions.length) {
    return {
      error: false,
      items: [] as HomeEventPreviewItem[],
      regions: [] as string[],
    };
  }

  const loaded = await loadRecruitingEvents({ nearbyRegions: regions });
  if (loaded.error) {
    return { error: true, items: [] as HomeEventPreviewItem[], regions };
  }

  const sorted = sortNearbyEventItems(loaded.items, regions).slice(0, limit);

  return {
    error: false,
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
  if (!trimmed) {
    return { error: false, items: [] as HomeEventPreviewItem[] };
  }

  const loaded = await loadRecruitingEvents({ nearbyRegions: [trimmed] });
  if (loaded.error) return loaded;

  return {
    error: false,
    items: sortNearbyEventItems(loaded.items, [trimmed])
      .slice(0, limit)
      .map((item) => ({
        ...item,
        nearbyLabel: formatNearbyEventLabel(item.event.region, [trimmed]),
      })),
  };
}
