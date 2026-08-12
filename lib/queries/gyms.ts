import type { Gym } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/server";
import { getTodayDateString } from "@/lib/utils/date";

export type GymFilters = {
  region?: string;
  sport?: string;
  searchQuery?: string;
  facilities?: string[];
  beginnerWelcome?: boolean;
  nearbyRegions?: string[];
};

export type GymUpcomingEventPreview = {
  id: string;
  title: string;
  event_date: string;
};

export type GymWithEventCount = Gym & {
  upcomingEventCount: number;
  upcomingEvents: GymUpcomingEventPreview[];
};

function gymMatchesFacilityFilter(
  facilities: string[] | null | undefined,
  filter: string,
): boolean {
  const list = facilities ?? [];

  if (filter === "샤워실") {
    return list.includes("샤워실");
  }

  if (filter === "parking") {
    return list.some(
      (item) =>
        item.startsWith("주차") ||
        item === "주차 가능" ||
        item === "무료 주차",
    );
  }

  if (filter === "parking_free") {
    return list.some(
      (item) =>
        item === "무료 주차" ||
        item.startsWith("주차:무료") ||
        item === "주차:무료",
    );
  }

  return list.includes(filter);
}

function gymMatchesFacilities(
  facilities: string[] | null | undefined,
  filters: string[] | undefined,
): boolean {
  if (!filters?.length) return true;
  return filters.every((filter) =>
    gymMatchesFacilityFilter(facilities, filter),
  );
}

export async function getPublicGyms(
  filters: GymFilters = {},
): Promise<{ data: Gym[]; error: Error | null }> {
  const supabase = await createClient();

  let query = supabase
    .from("gyms")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (filters.region) {
    query = query.ilike("region", `%${filters.region}%`);
  }

  if (filters.nearbyRegions?.length) {
    const regionFilter = filters.nearbyRegions
      .map((region) => `region.ilike.%${region}%`)
      .join(",");
    query = query.or(regionFilter);
  }

  if (filters.sport) {
    query = query.ilike("sport", `%${filters.sport}%`);
  }

  if (filters.searchQuery?.trim()) {
    const q = filters.searchQuery.trim();
    query = query.or(
      `name.ilike.%${q}%,region.ilike.%${q}%,address.ilike.%${q}%`,
    );
  }

  if (filters.beginnerWelcome) {
    query = query.eq("first_visit_welcome", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    return { data: [], error: error as Error | null };
  }

  const filtered = data.filter((gym) =>
    gymMatchesFacilities(gym.facilities, filters.facilities),
  );

  return { data: filtered, error: null };
}

export async function getPublicGymById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gyms")
    .select("*")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();

  return { data, error };
}

export async function getUpcomingEventCountsByGym(
  gymIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();

  if (gymIds.length === 0) return map;

  const supabase = await createClient();
  const today = getTodayDateString();

  const { data } = await supabase
    .from("events")
    .select("gym_id")
    .in("gym_id", gymIds)
    .gte("event_date", today)
    .eq("recruitment_closed", false);

  for (const id of gymIds) {
    map.set(id, 0);
  }

  for (const row of data ?? []) {
    map.set(row.gym_id, (map.get(row.gym_id) ?? 0) + 1);
  }

  return map;
}

export async function getUpcomingEventsByGyms(
  gymIds: string[],
  limitPerGym = 2,
): Promise<Map<string, GymUpcomingEventPreview[]>> {
  const map = new Map<string, GymUpcomingEventPreview[]>();

  if (gymIds.length === 0) return map;

  const supabase = await createClient();
  const today = getTodayDateString();

  const { data } = await supabase
    .from("events")
    .select("id, gym_id, title, event_date")
    .in("gym_id", gymIds)
    .gte("event_date", today)
    .eq("recruitment_closed", false)
    .order("event_date", { ascending: true });

  for (const id of gymIds) {
    map.set(id, []);
  }

  for (const row of data ?? []) {
    const current = map.get(row.gym_id) ?? [];
    if (current.length < limitPerGym) {
      current.push({
        id: row.id,
        title: row.title,
        event_date: row.event_date,
      });
      map.set(row.gym_id, current);
    }
  }

  return map;
}

export async function attachUpcomingEventCounts(
  gyms: Gym[],
): Promise<GymWithEventCount[]> {
  const gymIds = gyms.map((gym) => gym.id);
  const [counts, previews] = await Promise.all([
    getUpcomingEventCountsByGym(gymIds),
    getUpcomingEventsByGyms(gymIds),
  ]);

  return gyms.map((gym) => ({
    ...gym,
    upcomingEventCount: counts.get(gym.id) ?? 0,
    upcomingEvents: previews.get(gym.id) ?? [],
  }));
}

export async function getRecommendedGyms(
  limit = 3,
): Promise<GymWithEventCount[]> {
  const { data: gyms } = await getPublicGyms({});

  if (!gyms.length) return [];

  const withCounts = await attachUpcomingEventCounts(gyms);

  return [...withCounts]
    .sort((a, b) => {
      const countDiff = b.upcomingEventCount - a.upcomingEventCount;
      if (countDiff !== 0) return countDiff;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    })
    .slice(0, limit);
}

export async function getUpcomingEventsForGym(gymId: string) {
  const supabase = await createClient();
  const today = getTodayDateString();

  const { data, error } = await supabase
    .from("events")
    .select("id, title, sport, region, event_date, event_time, event_type, max_participants, fee_amount, recruitment_closed")
    .eq("gym_id", gymId)
    .gte("event_date", today)
    .eq("recruitment_closed", false)
    .order("event_date", { ascending: true });

  return { data: data ?? [], error };
}
