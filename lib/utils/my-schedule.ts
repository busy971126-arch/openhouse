import { getTodayDateString } from "@/lib/utils/date";
import { getWeekRange, isDateInRange } from "@/lib/utils/schedule-display";

export type MyScheduleTab = "today" | "week" | "past";

export type ScheduleTabCounts = {
  today: number;
  week: number;
  past: number;
};

export function parseMyScheduleTab(value: string | undefined): MyScheduleTab {
  if (value === "today" || value === "week" || value === "past") {
    return value;
  }
  return "today";
}

export function getDefaultScheduleTabForEventDate(
  eventDate: string,
  today = getTodayDateString(),
): MyScheduleTab {
  if (eventDate < today) return "past";
  if (eventDate === today) return "today";
  const weekRange = getWeekRange();
  if (isDateInRange(eventDate, weekRange)) return "week";
  return "week";
}

export function bucketScheduleByTab<T extends { eventDate: string; status?: string }>(
  items: T[],
  today = getTodayDateString(),
): Record<MyScheduleTab, T[]> {
  const weekRange = getWeekRange();
  const todayItems: T[] = [];
  const weekItems: T[] = [];
  const pastItems: T[] = [];

  const isActive = (item: T) =>
    !item.status || item.status === "pending" || item.status === "approved";

  for (const item of items) {
    const isPastDate = item.eventDate < today;
    const isInactive =
      item.status === "cancelled" || item.status === "rejected";

    if (isPastDate || isInactive) {
      pastItems.push(item);
      continue;
    }

    if (!isActive(item)) {
      pastItems.push(item);
      continue;
    }

    if (item.eventDate === today) {
      todayItems.push(item);
      continue;
    }
    if (isDateInRange(item.eventDate, weekRange)) {
      weekItems.push(item);
    }
  }

  const sortAsc = (a: T, b: T) => a.eventDate.localeCompare(b.eventDate);
  const sortDesc = (a: T, b: T) => b.eventDate.localeCompare(a.eventDate);

  return {
    today: todayItems.sort(sortAsc),
    week: weekItems.sort(sortAsc),
    past: pastItems.sort(sortDesc),
  };
}

export function countScheduleTabs<T extends { eventDate: string }>(
  items: T[],
): ScheduleTabCounts {
  const buckets = bucketScheduleByTab(items);
  return {
    today: buckets.today.length,
    week: buckets.week.length,
    past: buckets.past.length,
  };
}

export function scheduleTabHref(tab: MyScheduleTab): string {
  return `/my/registrations?tab=${tab}`;
}
