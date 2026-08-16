import { createClient } from "@/lib/supabase/server";
import { countHostPendingRegistrationsByGymIds } from "@/lib/queries/host-registration-stats";
import { getTodayDateString } from "@/lib/utils/date";

export type MyPageData = {
  isOperator: boolean;
  pendingApprovals: number;
  profile: {
    nickname: string | null;
    displayName: string | null;
  } | null;
};

export async function getMyPageData(userId: string): Promise<MyPageData> {
  const supabase = await createClient();

  const [{ data: gyms }, { data: profile }] = await Promise.all([
    supabase.from("gyms").select("id").eq("owner_id", userId),
    supabase
      .from("profiles")
      .select("nickname, display_name")
      .eq("id", userId)
      .single(),
  ]);

  const gymIds = (gyms ?? []).map((gym) => gym.id);
  const isOperator = gymIds.length > 0;
  const pendingApprovals = isOperator
    ? await countHostPendingRegistrationsByGymIds(gymIds)
    : 0;

  return {
    isOperator,
    pendingApprovals,
    profile: profile
      ? {
          nickname: profile.nickname,
          displayName: profile.display_name,
        }
      : null,
  };
}

export async function countOperatingEventsForGym(gymId: string): Promise<number> {
  const supabase = await createClient();
  const today = getTodayDateString();

  const { count } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("gym_id", gymId)
    .gte("event_date", today);

  return count ?? 0;
}
