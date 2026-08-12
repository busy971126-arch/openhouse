import { createClient } from "@/lib/supabase/server";

export async function getApprovedCountsByEvent(
  eventIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (eventIds.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase
    .from("registrations")
    .select("event_id")
    .in("event_id", eventIds)
    .eq("status", "approved");

  for (const id of eventIds) {
    map.set(id, 0);
  }

  for (const row of data ?? []) {
    map.set(row.event_id, (map.get(row.event_id) ?? 0) + 1);
  }

  return map;
}

export type EventRegistrationCounts = {
  approved: number;
  pending: number;
  total: number;
};

export async function getRegistrationCountsByEvent(
  eventIds: string[],
): Promise<Map<string, EventRegistrationCounts>> {
  const map = new Map<string, EventRegistrationCounts>();
  if (eventIds.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase
    .from("registrations")
    .select("event_id, status")
    .in("event_id", eventIds)
    .in("status", ["pending", "approved"]);

  for (const id of eventIds) {
    map.set(id, { approved: 0, pending: 0, total: 0 });
  }

  for (const row of data ?? []) {
    const current = map.get(row.event_id)!;
    if (row.status === "approved") current.approved += 1;
    if (row.status === "pending") current.pending += 1;
    current.total += 1;
  }

  return map;
}
