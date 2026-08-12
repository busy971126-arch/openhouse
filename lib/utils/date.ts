const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function formatEventDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  return `${year}.${month}.${day}`;
}

/** 이벤트 상세: 2026.08.16 (일) */
export function formatEventDetailDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return formatEventDate(dateStr);

  const date = new Date(year, month - 1, day);
  const weekday = WEEKDAY_LABELS[date.getDay()] ?? "";
  return `${formatEventDate(dateStr)} (${weekday})`;
}

/** 이벤트 시간 표시 (종료 시간 없으면 시작만) */
export function formatEventTimeDisplay(time: string | null | undefined): string | null {
  if (!time?.trim()) return null;
  return time.slice(0, 5);
}

/** 목록·다음 이벤트: 8/30 또는 2026.08.30 */
export function formatEventListDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!month || !day) return dateStr;
  const currentYear = new Date().getFullYear();
  if (year === currentYear) return `${month}/${day}`;
  return formatEventDate(dateStr);
}

export function getMapSearchUrl(address: string): string {
  return `https://map.kakao.com/link/search/${encodeURIComponent(address.trim())}`;
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toDateString(tomorrow);
}

export function getTodayDateString(): string {
  return toDateString(new Date());
}
