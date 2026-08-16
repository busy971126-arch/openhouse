import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type RegistrationCountRow = {
  event_id: string;
  approved_count: number;
};

async function fetchApprovedCountsByRpc(
  supabase: SupabaseServerClient,
  eventIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (eventIds.length === 0) return map;

  for (const id of eventIds) {
    map.set(id, 0);
  }

  const { data, error } = await supabase.rpc("get_event_registration_counts", {
    p_event_ids: eventIds,
  });

  if (error) {
    console.error("get_event_registration_counts error:", error);
    return map;
  }

  // RPC approved_count = pending + approved (public display / capacity)
  for (const row of (data ?? []) as RegistrationCountRow[]) {
    if (row?.event_id != null && typeof row.approved_count === "number") {
      map.set(row.event_id, row.approved_count);
    }
  }

  return map;
}

export async function getApprovedCountByRpc(
  supabase: SupabaseServerClient,
  eventId: string,
): Promise<number> {
  const map = await fetchApprovedCountsByRpc(supabase, [eventId]);
  return map.get(eventId) ?? 0;
}

export async function getApprovedCountsByEvent(
  eventIds: string[],
): Promise<Map<string, number>> {
  const supabase = await createClient();
  return fetchApprovedCountsByRpc(supabase, eventIds);
}

export type EventRegistrationCounts = {
  approved: number;
  pending: number;
  total: number;
};

/** Host dashboards — requires event-owner RLS on registrations */
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
