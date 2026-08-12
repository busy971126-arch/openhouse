export type DayHours = {
  start: string;
  end: string;
};

export type OperatingHoursFields = {
  weekday: DayHours;
  weekend: DayHours;
};

const EMPTY: OperatingHoursFields = {
  weekday: { start: "", end: "" },
  weekend: { start: "", end: "" },
};

/** DB 저장 형식: weekday:18:00-22:00|weekend:10:00-15:00 */
export function serializeOperatingHours(
  hours: OperatingHoursFields,
): string | null {
  const parts: string[] = [];

  if (hours.weekday.start && hours.weekday.end) {
    parts.push(`weekday:${hours.weekday.start}-${hours.weekday.end}`);
  }
  if (hours.weekend.start && hours.weekend.end) {
    parts.push(`weekend:${hours.weekend.start}-${hours.weekend.end}`);
  }

  return parts.length > 0 ? parts.join("|") : null;
}

export function parseOperatingHours(
  value: string | null | undefined,
): OperatingHoursFields {
  if (!value?.trim()) return { ...EMPTY };

  const result: OperatingHoursFields = {
    weekday: { start: "", end: "" },
    weekend: { start: "", end: "" },
  };

  for (const segment of value.split("|")) {
    const match = segment.trim().match(/^(weekday|weekend):(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (!match) continue;
    const [, key, start, end] = match;
    if (key === "weekday") result.weekday = { start, end };
    if (key === "weekend") result.weekend = { start, end };
  }

  if (result.weekday.start || result.weekend.start) return result;

  return { ...EMPTY };
}

/** 화면 표시용 (읽기 전용) */
export function formatOperatingHoursDisplay(
  value: string | null | undefined,
): string | null {
  const { weekday, weekend } = parseOperatingHours(value);
  const lines: string[] = [];

  if (weekday.start && weekday.end) {
    lines.push(`평일 ${weekday.start} ~ ${weekday.end}`);
  }
  if (weekend.start && weekend.end) {
    lines.push(`주말 ${weekend.start} ~ ${weekend.end}`);
  }

  return lines.length > 0 ? lines.join("\n") : value?.trim() || null;
}
