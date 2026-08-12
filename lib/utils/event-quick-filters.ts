import { getTodayDateString, toDateString } from "@/lib/utils/date";

export type EventQuickFilter = "today" | "week" | "month" | "nearby";

export const EVENT_QUICK_FILTER_OPTIONS: {
  value: EventQuickFilter;
  label: string;
}[] = [
  { value: "today", label: "오늘" },
  { value: "week", label: "이번 주" },
  { value: "month", label: "이번 달" },
];

export const EVENT_SECONDARY_QUICK_FILTER_OPTIONS: {
  value: EventQuickFilter;
  label: string;
}[] = [{ value: "nearby", label: "내 지역" }];

export function getWeekDateRange(from = new Date()): {
  start: string;
  end: string;
} {
  const start = new Date(from);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: toDateString(start),
    end: toDateString(end),
  };
}

/** @deprecated use getWeekDateRange — kept for tests */
export function getWeekendDateRange(from = new Date()): {
  start: string;
  end: string;
} {
  const day = from.getDay();
  const saturdayOffset = day === 0 ? -1 : 6 - day;
  const saturday = new Date(from);
  saturday.setDate(from.getDate() + saturdayOffset);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  return {
    start: toDateString(saturday),
    end: toDateString(sunday),
  };
}

export function getMonthDateRange(from = new Date()): {
  start: string;
  end: string;
} {
  const start = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(from.getFullYear(), from.getMonth() + 1, 0);

  return {
    start: toDateString(start),
    end: toDateString(end),
  };
}

export function getQuickFilterDateRange(
  quick: EventQuickFilter | undefined,
): { start?: string; end?: string; single?: string } | null {
  if (!quick || quick === "nearby") return null;

  if (quick === "today") {
    const today = getTodayDateString();
    return { single: today };
  }

  if (quick === "week") {
    return getWeekDateRange();
  }

  if (quick === "month") {
    return getMonthDateRange();
  }

  return null;
}
