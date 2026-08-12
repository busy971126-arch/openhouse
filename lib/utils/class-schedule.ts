import {
  CLASS_SCHEDULE_DAY_ORDER,
  CLASS_SCHEDULE_DAYS,
  type ClassScheduleDay,
} from "@/lib/constants/class-schedule";

export type ClassScheduleEntry = {
  id: string;
  day: ClassScheduleDay;
  className: string;
  start: string;
  end: string;
};

export type ClassScheduleDraft = {
  days: ClassScheduleDay[];
  className: string;
  start: string;
  end: string;
};

export type ClassScheduleGroup = {
  key: string;
  days: ClassScheduleDay[];
  className: string;
  start: string;
  end: string;
  entryIds: string[];
};

const EMPTY_DRAFT: ClassScheduleDraft = {
  days: [],
  className: "",
  start: "",
  end: "",
};

export function createEmptyDraft(): ClassScheduleDraft {
  return { ...EMPTY_DRAFT, days: [] };
}

export function createEntryId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `slot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function sortDays(days: ClassScheduleDay[]): ClassScheduleDay[] {
  return [...days].sort(
    (a, b) => CLASS_SCHEDULE_DAY_ORDER[a] - CLASS_SCHEDULE_DAY_ORDER[b],
  );
}

export function formatDaysLabel(days: ClassScheduleDay[]): string {
  if (days.length === 1) return days[0];
  return sortDays(days).join(" · ");
}

function groupKey(entry: Pick<ClassScheduleEntry, "className" | "start" | "end">) {
  return `${entry.className}::${entry.start}::${entry.end}`;
}

/** 동일 수업명·시간대끼리 요일을 묶어 표시 */
export function groupClassSchedule(
  entries: ClassScheduleEntry[],
): ClassScheduleGroup[] {
  const map = new Map<string, ClassScheduleGroup>();

  for (const entry of entries) {
    const key = groupKey(entry);
    const existing = map.get(key);
    if (existing) {
      existing.days.push(entry.day);
      existing.entryIds.push(entry.id);
      existing.days = sortDays([...new Set(existing.days)]);
      continue;
    }

    map.set(key, {
      key,
      days: [entry.day],
      className: entry.className,
      start: entry.start,
      end: entry.end,
      entryIds: [entry.id],
    });
  }

  return [...map.values()].sort((a, b) => {
    const dayDiff =
      CLASS_SCHEDULE_DAY_ORDER[a.days[0]] - CLASS_SCHEDULE_DAY_ORDER[b.days[0]];
    if (dayDiff !== 0) return dayDiff;
    return a.start.localeCompare(b.start);
  });
}

export function validateDraft(draft: ClassScheduleDraft): string | null {
  if (draft.days.length === 0) return "요일을 하나 이상 선택해주세요.";
  if (!draft.start || !draft.end) return "시작·종료 시간을 입력해주세요.";
  if (draft.start >= draft.end) {
    return "종료 시간은 시작 시간보다 늦어야 합니다.";
  }
  return null;
}

/** 선택한 요일마다 개별 항목 생성 */
export function expandDraftToEntries(
  draft: ClassScheduleDraft,
): ClassScheduleEntry[] {
  const className = draft.className.trim();
  return sortDays(draft.days).map((day) => ({
    id: createEntryId(),
    day,
    className,
    start: draft.start,
    end: draft.end,
  }));
}

export function addDraftToSchedule(
  entries: ClassScheduleEntry[],
  draft: ClassScheduleDraft,
): ClassScheduleEntry[] {
  return [...entries, ...expandDraftToEntries(draft)];
}

export function removeScheduleEntries(
  entries: ClassScheduleEntry[],
  entryIds: string[],
): ClassScheduleEntry[] {
  const removeSet = new Set(entryIds);
  return entries.filter((entry) => !removeSet.has(entry.id));
}

export function replaceScheduleGroup(
  entries: ClassScheduleEntry[],
  entryIds: string[],
  draft: ClassScheduleDraft,
): ClassScheduleEntry[] {
  const withoutOld = removeScheduleEntries(entries, entryIds);
  return addDraftToSchedule(withoutOld, draft);
}

export function draftFromGroup(group: ClassScheduleGroup): ClassScheduleDraft {
  return {
    days: [...group.days],
    className: group.className,
    start: group.start,
    end: group.end,
  };
}

type StoredEntry = {
  id?: string;
  day: string;
  className?: string;
  start: string;
  end: string;
};

export function parseClassSchedule(value: unknown): ClassScheduleEntry[] {
  if (!Array.isArray(value)) return [];

  const validDays = new Set<string>(CLASS_SCHEDULE_DAYS);
  const entries: ClassScheduleEntry[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as StoredEntry;
    if (!validDays.has(row.day) || !row.start || !row.end) continue;

    entries.push({
      id: row.id ?? createEntryId(),
      day: row.day as ClassScheduleDay,
      className: row.className?.trim() ?? "",
      start: row.start,
      end: row.end,
    });
  }

  return entries.sort((a, b) => {
    const dayDiff = CLASS_SCHEDULE_DAY_ORDER[a.day] - CLASS_SCHEDULE_DAY_ORDER[b.day];
    if (dayDiff !== 0) return dayDiff;
    return a.start.localeCompare(b.start);
  });
}

export function serializeClassSchedule(
  entries: ClassScheduleEntry[],
): ClassScheduleEntry[] {
  return entries.map(({ id, day, className, start, end }) => ({
    id,
    day,
    className: className.trim(),
    start,
    end,
  }));
}

export function formatClassScheduleDisplay(
  entries: ClassScheduleEntry[],
): string | null {
  const groups = groupClassSchedule(entries);
  if (groups.length === 0) return null;

  return groups
    .map((group) => {
      const nameLine = group.className ? `${group.className}\n` : "";
      return `${formatDaysLabel(group.days)}\n${nameLine}${group.start} ~ ${group.end}`;
    })
    .join("\n\n");
}

const WEEKDAY_SET = new Set<ClassScheduleDay>(["월", "화", "수", "목", "금"]);
const WEEKEND_SET = new Set<ClassScheduleDay>(["토", "일"]);

function minTime(a: string, b: string) {
  return a < b ? a : b;
}

function maxTime(a: string, b: string) {
  return a > b ? a : b;
}

/** 수업 시간표의 가장 이른 시작·늦은 종료 시각으로 운영 시간 문구 생성 */
export function deriveOperatingHoursFromSchedule(
  entries: ClassScheduleEntry[],
): string | null {
  if (entries.length === 0) return null;

  let weekdayStart = "";
  let weekdayEnd = "";
  let weekendStart = "";
  let weekendEnd = "";

  for (const entry of entries) {
    if (WEEKDAY_SET.has(entry.day)) {
      weekdayStart = weekdayStart
        ? minTime(weekdayStart, entry.start)
        : entry.start;
      weekdayEnd = weekdayEnd ? maxTime(weekdayEnd, entry.end) : entry.end;
    }

    if (WEEKEND_SET.has(entry.day)) {
      weekendStart = weekendStart
        ? minTime(weekendStart, entry.start)
        : entry.start;
      weekendEnd = weekendEnd ? maxTime(weekendEnd, entry.end) : entry.end;
    }
  }

  const parts: string[] = [];

  if (weekdayStart && weekdayEnd) {
    parts.push(`평일 ${weekdayStart} ~ ${weekdayEnd}`);
  }

  if (weekendStart && weekendEnd) {
    parts.push(`주말 ${weekendStart} ~ ${weekendEnd}`);
  }

  return parts.length > 0 ? parts.join(", ") : null;
}
