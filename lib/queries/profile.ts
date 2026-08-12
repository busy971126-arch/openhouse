import { createClient } from "@/lib/supabase/server";

export type ProfileStats = {
  participationCount: number;
  operationCount: number;
  isGymOperator: boolean;
};

/** 승인된 참가 횟수 + 호스트 일정 운영 횟수 */
export async function getProfileStats(
  userId: string,
): Promise<ProfileStats> {
  const supabase = await createClient();

  const [{ count: participationCount }, { data: gyms }] = await Promise.all([
    supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "approved"),
    supabase.from("gyms").select("id").eq("owner_id", userId),
  ]);

  const gymIds = gyms?.map((gym) => gym.id) ?? [];
  let operationCount = 0;

  if (gymIds.length > 0) {
    const { count } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .in("gym_id", gymIds);

    operationCount = count ?? 0;
  }

  return {
    participationCount: participationCount ?? 0,
    operationCount,
    isGymOperator: gymIds.length > 0,
  };
}
