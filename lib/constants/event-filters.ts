import { GYM_REGION_OPTIONS } from "@/lib/constants/profile";
import { EVENT_SPORT_FILTER_OPTIONS } from "@/lib/constants/sports";

export const EVENT_REGION_FILTER_OPTIONS = GYM_REGION_OPTIONS;

export { EVENT_SPORT_FILTER_OPTIONS };

export function buildFilterDate(
  year: string,
  month: string,
  day: string,
): string | null {
  if (!year && !month && !day) return null;
  if (!year || !month || !day) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function parseFilterDate(date: string): {
  year: string;
  month: string;
  day: string;
} {
  if (!date) return { year: "", month: "", day: "" };
  const [year, month, day] = date.split("-");
  return {
    year: year ?? "",
    month: month ?? "",
    day: day ?? "",
  };
}

export function getEventFilterYearOptions(): string[] {
  const current = new Date().getFullYear();
  return [current, current + 1, current + 2].map(String);
}

export const EVENT_FILTER_MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);

export const EVENT_FILTER_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
