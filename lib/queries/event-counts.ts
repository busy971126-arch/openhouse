import { createClient } from "@/lib/supabase/server";
import {
  buildApprovedCountsResult,
  type ApprovedCountsResult,
  type RegistrationCountRow,
} from "@/lib/utils/event-counts-map";

export type { ApprovedCountsResult, RegistrationCountRow };
export { buildApprovedCountsResult, getApprovedCountFromResult } from "@/lib/utils/event-counts-map";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function fetchApprovedCountsByRpc(
  supabase: SupabaseServerClient,
  eventIds: string[],
): Promise<ApprovedCountsResult> {
  if (eventIds.length === 0) {
    return { status: "success", counts: new Map() };
  }

  const { data, error } = await supabase.rpc("get_event_registration_counts", {
    p_event_ids: eventIds,
  });

  if (error) {
    console.error("get_event_registration_counts error:", error);
  }

  return buildApprovedCountsResult(
    eventIds,
    data as RegistrationCountRow[] | null,
    error,
  );
}

export async function getApprovedCountByRpc(
  supabase: SupabaseServerClient,
  eventId: string,
): Promise<number | null> {
  const result = await fetchApprovedCountsByRpc(supabase, [eventId]);
  if (result.status !== "success") return null;
  return result.counts.get(eventId) ?? 0;
}

export async function getApprovedCountsByEvent(
  eventIds: string[],
): Promise<ApprovedCountsResult> {
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
