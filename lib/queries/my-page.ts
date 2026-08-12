import { createClient } from "@/lib/supabase/server";
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
    supabase.from("gyms").select("id").eq("owner_id", userId).limit(1),
    supabase
      .from("profiles")
      .select("nickname, display_name")
      .eq("id", userId)
      .single(),
  ]);

  const isOperator = (gyms?.length ?? 0) > 0;
  let pendingApprovals = 0;

  if (isOperator) {
    const { data: events } = await supabase
      .from("events")
      .select("id, gyms!inner(owner_id)")
      .eq("gyms.owner_id", userId);

    const eventIds = (events ?? []).map((event) => event.id);
    if (eventIds.length > 0) {
      const { count } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .in("event_id", eventIds)
        .eq("status", "pending");

      pendingApprovals = count ?? 0;
    }
  }

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
