export const RECURRING_DAY_CODES = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type EventRecurringDay = (typeof RECURRING_DAY_CODES)[number];

export const RECURRING_DAY_OPTIONS: {
  value: EventRecurringDay;
  label: string;
}[] = [
  { value: "mon", label: "월" },
  { value: "tue", label: "화" },
  { value: "wed", label: "수" },
  { value: "thu", label: "목" },
  { value: "fri", label: "금" },
  { value: "sat", label: "토" },
  { value: "sun", label: "일" },
];

export const WEEKDAY_CODES: EventRecurringDay[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
];

export const WEEKEND_CODES: EventRecurringDay[] = ["sat", "sun"];

export function isEventRecurringDay(value: string): value is EventRecurringDay {
  return (RECURRING_DAY_CODES as readonly string[]).includes(value);
}

export function normalizeRecurringDays(
  value: readonly string[] | null | undefined,
): EventRecurringDay[] {
  if (!value?.length) return [];

  const unique = new Set<EventRecurringDay>();
  for (const item of value) {
    if (isEventRecurringDay(item)) {
      unique.add(item);
    }
  }

  return RECURRING_DAY_CODES.filter((day) => unique.has(day));
}

/** Persist null when empty (one-off event). */
export function serializeRecurringDays(
  days: readonly EventRecurringDay[],
): EventRecurringDay[] | null {
  const normalized = normalizeRecurringDays(days);
  return normalized.length > 0 ? normalized : null;
}

export function formatRecurringDaysLabel(
  days: readonly string[] | null | undefined,
): string | null {
  const normalized = normalizeRecurringDays(days);
  if (normalized.length === 0) return null;

  const labels = RECURRING_DAY_OPTIONS.filter((option) =>
    normalized.includes(option.value),
  ).map((option) => option.label);

  return labels.join(" · ");
}

export function toggleRecurringDay(
  current: readonly EventRecurringDay[],
  day: EventRecurringDay,
): EventRecurringDay[] {
  if (current.includes(day)) {
    return current.filter((value) => value !== day);
  }

  return normalizeRecurringDays([...current, day]);
}

export function setRecurringDayPreset(
  preset: "weekday" | "weekend",
): EventRecurringDay[] {
  return preset === "weekday" ? [...WEEKDAY_CODES] : [...WEEKEND_CODES];
}
