import { createClient } from "@/lib/supabase/server";
import { getUserGyms } from "@/lib/queries/events";
import { getHostRegistrationCountsFullByEventIds } from "@/lib/queries/host-registration-stats";
import { REGISTRATION_WITH_PROFILE_SELECT } from "@/lib/queries/registration-select";
import { mapRegistrationToParticipantItem } from "@/lib/utils/participant-items";
import type { ParticipantItem } from "@/lib/utils/participant-items";
import type { EventLifecycleStatus } from "@/lib/types/database";

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
  eventTime: string | null;
  maxParticipants: number | null;
  recruitmentClosed: boolean;
  registrationDeadline: string | null;
  status: EventLifecycleStatus;
  counts: HostEventCounts;
};

async function getRegistrationCountsByEvent(
  eventIds: string[],
): Promise<Map<string, HostEventCounts>> {
  const countsMap = await getHostRegistrationCountsFullByEventIds(eventIds);
  const map = new Map<string, HostEventCounts>();

  for (const id of eventIds) {
    map.set(
      id,
      countsMap.get(id) ?? {
        approved: 0,
        pending: 0,
        cancelled: 0,
        rejected: 0,
        total: 0,
      },
    );
  }

  return map;
}

export async function getHostGyms(userId: string): Promise<HostGymOption[]> {
  const { data } = await getUserGyms(userId);
  return (data ?? []).map((gym) => ({ id: gym.id, name: gym.name }));
}

export async function getHostEventsForGym(
  gymId: string,
): Promise<{ events: HostEventOption[]; error: boolean }> {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, title, event_date, event_time, max_participants, recruitment_closed, registration_deadline, status",
    )
    .eq("gym_id", gymId)
    .order("event_date", { ascending: false });

  if (error) return { events: [], error: true };
  if (!events?.length) return { events: [], error: false };

  const eventIds = events.map((event) => event.id);
  const countsMap = await getRegistrationCountsByEvent(eventIds);

  return {
    error: false,
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      eventDate: event.event_date,
      eventTime: event.event_time,
      maxParticipants: event.max_participants,
      recruitmentClosed: event.recruitment_closed ?? false,
      registrationDeadline: event.registration_deadline,
      status: (event.status ?? "active") as EventLifecycleStatus,
      counts: countsMap.get(event.id) ?? {
        approved: 0,
        pending: 0,
        cancelled: 0,
        rejected: 0,
        total: 0,
      },
    })),
  };
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
): Promise<{ registrations: ParticipantItem[]; error: boolean }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("registrations")
    .select(REGISTRATION_WITH_PROFILE_SELECT)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getHostParticipantsForEvent error:", error.message);
    return { registrations: [], error: true };
  }

  return {
    error: false,
    registrations: (data ?? []).map(mapRegistrationToParticipantItem),
  };
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
      .select(REGISTRATION_WITH_PROFILE_SELECT)
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
