import { createClient } from "@/lib/supabase/server";
import {
  parsePendingGymInfo,
  type PendingGymInfo,
} from "@/lib/utils/pending-gym-info";

export async function getPendingGymRegistration(
  userId: string,
): Promise<PendingGymInfo | null> {
  const supabase = await createClient();

  const [{ count: gymCount }, { data: pendingRaw }] = await Promise.all([
    supabase
      .from("gyms")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId),
    supabase.rpc("get_my_pending_gym_info"),
  ]);

  if ((gymCount ?? 0) > 0) {
    return null;
  }

  return parsePendingGymInfo(pendingRaw);
}

export async function clearPendingGymInfo(userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ pending_gym_info: null })
    .eq("id", userId);
}
