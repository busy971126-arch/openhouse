import {
  formatEventListDate,
  formatEventTimeDisplay,
  getTodayDateString,
  toDateString,
} from "@/lib/utils/date";

export function getDaysUntil(eventDate: string, today = getTodayDateString()): number {
  const [y1, m1, d1] = today.split("-").map(Number);
  const [y2, m2, d2] = eventDate.split("-").map(Number);
  const start = new Date(y1, m1 - 1, d1);
  const target = new Date(y2, m2 - 1, d2);
  return Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatScheduleCountdown(
  eventDate: string,
  today = getTodayDateString(),
): string {
  const days = getDaysUntil(eventDate, today);
  if (days <= 0) return "D-0";
  return `D-${days}`;
}

export function formatScheduleWhenLabel(
  eventDate: string,
  eventTime: string | null | undefined,
  today = getTodayDateString(),
): string {
  const time = formatEventTimeDisplay(eventTime);
  const [y, m, d] = today.split("-").map(Number);
  const tomorrowDate = new Date(y, m - 1, d);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = toDateString(tomorrowDate);

  if (eventDate === today) {
    return time ? `오늘 ${time}` : "오늘";
  }
  if (eventDate === tomorrow) {
    return time ? `내일 ${time}` : "내일";
  }

  const dateLabel = formatEventListDate(eventDate);
  return time ? `${dateLabel} ${time}` : dateLabel;
}

export function getWeekRange(reference = new Date()): { start: string; end: string } {
  const day = reference.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(reference);
  monday.setDate(reference.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateString(monday), end: toDateString(sunday) };
}

export function isDateInRange(
  date: string,
  range: { start: string; end: string },
): boolean {
  return date >= range.start && date <= range.end;
}
