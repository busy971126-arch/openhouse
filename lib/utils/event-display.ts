import { formatEventFee } from "@/lib/constants/event-meta";
import { formatEventTimeDisplay } from "@/lib/utils/date";

export function formatParticipantCount(
  approvedCount: number,
  maxParticipants: number | null,
): string {
  if (maxParticipants != null && maxParticipants > 0) {
    return `${approvedCount} / ${maxParticipants}명`;
  }
  return `${approvedCount}명`;
}

export function formatEventTimeRange(time: string | null | undefined): string | null {
  const start = formatEventTimeDisplay(time);
  if (!start) return null;
  return start;
}

export function formatEventFeeDisplay(
  amount: number | null | undefined,
): string {
  const fee = formatEventFee(amount);
  return fee ?? "무료";
}
