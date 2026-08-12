import { createClient } from "@/lib/supabase/server";
import { getUserGyms } from "@/lib/queries/events";
import { mapRegistrationToParticipantItem } from "@/lib/utils/participant-items";
import type { ParticipantItem } from "@/lib/utils/participant-items";

export type HostGymOption = {
  id: string;
  name: string;
};

export type HostEventCounts = {
  approved: number;
  pending: number;
  cancelled: number;
  rejected: number;
  total: number;
};

export type HostEventOption = {
  id: string;
  title: string;
  eventDate: string;
  maxParticipants: number | null;
  counts: HostEventCounts;
};

async function getRegistrationCountsByEvent(
  eventIds: string[],
): Promise<Map<string, HostEventCounts>> {
  const map = new Map<string, HostEventCounts>();

  if (eventIds.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase
    .from("registrations")
    .select("event_id, status")
    .in("event_id", eventIds);

  for (const id of eventIds) {
    map.set(id, {
      approved: 0,
      pending: 0,
      cancelled: 0,
      rejected: 0,
      total: 0,
    });
  }

  for (const row of data ?? []) {
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

export async function getHostGyms(userId: string): Promise<HostGymOption[]> {
  const { data } = await getUserGyms(userId);
  return (data ?? []).map((gym) => ({ id: gym.id, name: gym.name }));
}

export async function getHostEventsForGym(
  gymId: string,
): Promise<HostEventOption[]> {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, event_date, max_participants")
    .eq("gym_id", gymId)
    .order("event_date", { ascending: false });

  if (error || !events?.length) return [];

  const eventIds = events.map((event) => event.id);
  const countsMap = await getRegistrationCountsByEvent(eventIds);

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    eventDate: event.event_date,
    maxParticipants: event.max_participants,
    counts: countsMap.get(event.id) ?? {
      approved: 0,
      pending: 0,
      cancelled: 0,
      rejected: 0,
      total: 0,
    },
  }));
}

export async function verifyHostOwnsEvent(
  userId: string,
  eventId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("id, gyms!inner(owner_id)")
    .eq("id", eventId)
    .single();

  const gym = data?.gyms as unknown as { owner_id: string } | null;
  return gym?.owner_id === userId;
}

export async function getHostParticipantsForEvent(
  eventId: string,
): Promise<ParticipantItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("registrations")
    .select(
      "*, profiles(display_name, nickname, gender, age_group, experience, weight_class, phone, parent_phone, regions, preferred_sports)",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map(mapRegistrationToParticipantItem);
}

export async function getHostRegistrationDetail(
  eventId: string,
  registrationId: string,
): Promise<{
  participant: ParticipantItem;
  eventTitle: string;
  eventDate: string;
  gymId: string;
} | null> {
  const supabase = await createClient();

  const [{ data: event }, { data: registration }] = await Promise.all([
    supabase
      .from("events")
      .select("title, event_date, gym_id")
      .eq("id", eventId)
      .single(),
    supabase
      .from("registrations")
      .select(
        "*, profiles(display_name, nickname, gender, age_group, experience, weight_class, phone, parent_phone, regions, preferred_sports)",
      )
      .eq("id", registrationId)
      .eq("event_id", eventId)
      .maybeSingle(),
  ]);

  if (!event || !registration) return null;

  return {
    participant: mapRegistrationToParticipantItem(registration),
    eventTitle: event.title,
    eventDate: event.event_date,
    gymId: event.gym_id,
  };
}
