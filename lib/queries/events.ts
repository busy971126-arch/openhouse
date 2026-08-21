import type { EventFilters } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/server";
import { getApprovedCountsByEvent } from "@/lib/queries/event-counts";
import { REGISTRATION_WITH_PROFILE_SELECT } from "@/lib/queries/registration-select";
import { getTodayDateString } from "@/lib/utils/date";
import { PUBLIC_GYM_SELECT, EVENT_WITH_PUBLIC_GYM_SELECT } from "@/lib/queries/gym-select";

export async function getEvents(filters: EventFilters = {}) {
  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select("*, gyms!inner(name, region, photo_url, is_public, owner_id)")
    .eq("gyms.is_public", true)
    .eq("status", "active")
    .order("event_date", { ascending: true });

  if (!filters.includePast) {
    query = query.gte("event_date", getTodayDateString());
    query = query.eq("recruitment_closed", false);
  }

  if (filters.region) {
    query = query.ilike("region", `%${filters.region}%`);
  }
  if (filters.sport) {
    query = query.ilike("sport", `%${filters.sport}%`);
  }
  if (filters.date) {
    query = query.eq("event_date", filters.date);
  }
  if (filters.dateFrom) {
    query = query.gte("event_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("event_date", filters.dateTo);
  }
  if (filters.nearbyRegions?.length) {
    const regionFilter = filters.nearbyRegions
      .map((region) => `region.ilike.%${region}%`)
      .join(",");
    query = query.or(regionFilter);
  }
  if (filters.eventType) {
    query = query.eq("event_type", filters.eventType);
  }

  if (filters.searchQuery?.trim()) {
    const q = filters.searchQuery.trim();
    query = query.or(
      `title.ilike.%${q}%,region.ilike.%${q}%,gyms.name.ilike.%${q}%`,
    );
  }

  const { data, error } = await query;
  return { data, error };
}

export async function getEvent(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_WITH_PUBLIC_GYM_SELECT)
    .eq("id", id)
    .single();

  return { data, error };
}

export async function getUserGyms(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gyms")
    .select(PUBLIC_GYM_SELECT)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  return { data: data ?? [], error };
}

export async function getOwnerEvents(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select("*, gyms!inner(name, owner_id)")
    .eq("gyms.owner_id", userId)
    .order("event_date", { ascending: true });

  return { data, error };
}

export async function getRegistrationsForEvent(eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("registrations")
    .select(REGISTRATION_WITH_PROFILE_SELECT)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getUserRegistrations(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("registrations")
    .select("*, events(title, event_date, event_time, event_type, sport, region)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getUserRegistrationForEvent(
  userId: string,
  eventId: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  return { data, error };
}

export async function getAnnouncements(eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getApprovedCount(eventId: string) {
  const result = await getApprovedCountsByEvent([eventId]);
  if (result.status !== "success") {
    return { count: null as number | null, error: true };
  }

  return { count: result.counts.get(eventId) ?? 0, error: false };
}
