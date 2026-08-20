export type RegistrationCountRow = {
  event_id: string;
  approved_count: number;
};

export type ApprovedCountsResult =
  | { status: "success"; counts: Map<string, number> }
  | { status: "error" };

export function buildApprovedCountsResult(
  eventIds: string[],
  rows: RegistrationCountRow[] | null | undefined,
  error: unknown,
): ApprovedCountsResult {
  if (error) {
    return { status: "error" };
  }

  const map = new Map<string, number>();
  for (const id of eventIds) {
    map.set(id, 0);
  }

  for (const row of rows ?? []) {
    if (row?.event_id != null && typeof row.approved_count === "number") {
      map.set(row.event_id, row.approved_count);
    }
  }

  return { status: "success", counts: map };
}

export function getApprovedCountFromResult(
  result: ApprovedCountsResult,
  eventId: string,
): number | null {
  if (result.status !== "success") return null;
  return result.counts.get(eventId) ?? 0;
}
