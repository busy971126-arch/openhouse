import { createClient } from "@/lib/supabase/server";

export type HostRegistrationCountsBasic = {
  approved: number;
  pending: number;
  total: number;
};

export type HostRegistrationCountsFull = HostRegistrationCountsBasic & {
  cancelled: number;
  rejected: number;
};

type RpcHostCountRow = {
  event_id: string;
  pending_count: number;
  approved_count: number;
};

function logQueryError(label: string, error: { message?: string } | null) {
  if (!error) return;
  const detail =
    error.message?.trim() ||
    JSON.stringify(error, Object.getOwnPropertyNames(error));
  console.error(`${label}:`, detail);
}

function isMissingRpc(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const message = error.message ?? "";
  return (
    error.code === "PGRST202" ||
    message.includes("Could not find the function") ||
    message.includes("does not exist")
  );
}

export async function countHostPendingRegistrationsByGymIds(
  gymIds: string[],
): Promise<number> {
  if (gymIds.length === 0) return 0;

  const supabase = await createClient();

  const { data: rpcCount, error: rpcError } = await supabase.rpc(
    "get_host_pending_registration_count",
  );

  if (!rpcError) {
    return rpcCount ?? 0;
  }

  if (!isMissingRpc(rpcError)) {
    logQueryError("countHostPendingRegistrationsByGymIds rpc error", rpcError);
  }

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id")
    .in("gym_id", gymIds);

  if (eventsError) {
    logQueryError("countHostPendingRegistrationsByGymIds events error", eventsError);
    return 0;
  }

  const eventIds = (events ?? []).map((event) => event.id);
  if (eventIds.length === 0) return 0;

  const countsMap = await getHostRegistrationCountsByEventIds(eventIds);
  let pending = 0;
  for (const counts of countsMap.values()) {
    pending += counts.pending;
  }
  return pending;
}

export async function getHostRegistrationCountsByEventIds(
  eventIds: string[],
): Promise<Map<string, HostRegistrationCountsBasic>> {
  const map = new Map<string, HostRegistrationCountsBasic>();

  for (const id of eventIds) {
    map.set(id, { approved: 0, pending: 0, total: 0 });
  }

  if (eventIds.length === 0) return map;

  const supabase = await createClient();
  const { data: rpcRows, error: rpcError } = await supabase.rpc(
    "get_host_registration_counts_by_event",
    { p_event_ids: eventIds },
  );

  if (!rpcError) {
    for (const row of (rpcRows ?? []) as RpcHostCountRow[]) {
      if (!row?.event_id) continue;
      map.set(row.event_id, {
        approved: row.approved_count ?? 0,
        pending: row.pending_count ?? 0,
        total: (row.approved_count ?? 0) + (row.pending_count ?? 0),
      });
    }
    return map;
  }

  if (!isMissingRpc(rpcError)) {
    logQueryError("getHostRegistrationCountsByEventIds rpc error", rpcError);
  }

  const { data: rows, error } = await supabase
    .from("registrations")
    .select("event_id, status")
    .in("event_id", eventIds)
    .in("status", ["pending", "approved"]);

  if (error) {
    logQueryError("getHostRegistrationCountsByEventIds error", error);
    return map;
  }

  for (const row of rows ?? []) {
    const current = map.get(row.event_id);
    if (!current) continue;

    if (row.status === "approved") current.approved += 1;
    if (row.status === "pending") current.pending += 1;
    current.total += 1;
  }

  return map;
}

export async function getHostRegistrationCountsFullByEventIds(
  eventIds: string[],
): Promise<Map<string, HostRegistrationCountsFull>> {
  const map = new Map<string, HostRegistrationCountsFull>();

  for (const id of eventIds) {
    map.set(id, {
      approved: 0,
      pending: 0,
      cancelled: 0,
      rejected: 0,
      total: 0,
    });
  }

  if (eventIds.length === 0) return map;

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("registrations")
    .select("event_id, status")
    .in("event_id", eventIds);

  if (error) {
    logQueryError("getHostRegistrationCountsFullByEventIds error", error);
    return map;
  }

  for (const row of rows ?? []) {
    const current = map.get(row.event_id);
    if (!current) continue;

    current.total += 1;
    if (row.status === "approved") current.approved += 1;
    else if (row.status === "pending") current.pending += 1;
    else if (row.status === "cancelled") current.cancelled += 1;
    else if (row.status === "rejected") current.rejected += 1;
  }

  return map;
}
