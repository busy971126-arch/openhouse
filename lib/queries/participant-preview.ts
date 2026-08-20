import { createClient } from "@/lib/supabase/server";
import { parseParticipantPreview } from "@/lib/utils/participant-preview";

export async function getEventParticipantPreview(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: null, requiresAuth: true as const };
  }

  const { data, error } = await supabase.rpc("get_event_participant_preview", {
    p_event_id: eventId,
  });

  if (error) {
    return { data: null, error, requiresAuth: false as const };
  }

  return {
    data: parseParticipantPreview(data),
    error: null,
    requiresAuth: false as const,
  };
}

export async function isGymFollowed(userId: string, gymId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gym_follows")
    .select("gym_id")
    .eq("user_id", userId)
    .eq("gym_id", gymId)
    .maybeSingle();

  return { followed: !!data, error };
}

export async function getUserGymFollows(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gym_follows")
    .select(
      "gym_id, created_at, gyms(id, name, region, sport, photo_url, address, mat_photos, facility_photos, exterior_photos, parking_photos)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getFollowedGymUpcomingEvents(gymIds: string[]) {
  if (gymIds.length === 0) return { data: [], error: null };

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("events")
    .select("id, title, sport, region, event_date, gym_id, gyms(name)")
    .in("gym_id", gymIds)
    .gte("event_date", today)
    .eq("recruitment_closed", false)
    .order("event_date", { ascending: true })
    .limit(20);

  return { data, error };
}
