import { createClient } from "@/lib/supabase/server";

export async function getUserInterestedGymIds(
  userId: string | null | undefined,
): Promise<Set<string>> {
  if (!userId) return new Set();

  const supabase = await createClient();
  const { data } = await supabase
    .from("gym_follows")
    .select("gym_id")
    .eq("user_id", userId);

  return new Set((data ?? []).map((row) => row.gym_id));
}

export async function getUserInterestedEventIds(
  userId: string | null | undefined,
): Promise<Set<string>> {
  if (!userId) return new Set();

  const supabase = await createClient();
  const { data } = await supabase
    .from("event_interests")
    .select("event_id")
    .eq("user_id", userId);

  return new Set((data ?? []).map((row) => row.event_id));
}
