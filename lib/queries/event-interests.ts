import { createClient } from "@/lib/supabase/server";
import { getApprovedCountByRpc } from "@/lib/queries/event-counts";
import { getEventRecruitmentStatus } from "@/lib/utils/event-status";

export async function isEventInterested(userId: string, eventId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_interests")
    .select("event_id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .maybeSingle();

  return { interested: !!data, error };
}

export async function getUserEventInterests(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_interests")
    .select(
      "event_id, created_at, events(id, title, sport, region, event_date, event_type, max_participants, recruitment_closed, registration_deadline, status)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getUserReports(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("id, category, description, status, created_at, event_id, reported_user_id")
    .eq("reporter_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getUserInquiries(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inquiries")
    .select("id, category, message, status, admin_reply, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

async function getApprovedCountForEvent(eventId: string) {
  const supabase = await createClient();
  const count = await getApprovedCountByRpc(supabase, eventId);
  return { count, error: null };
}

export async function enrichEventInterestsWithStatus(
  interests: Array<{
    event_id: string;
    created_at: string;
    events: unknown;
  }>,
) {
  const enriched = await Promise.all(
    interests.map(async (item) => {
      const eventRaw = item.events;
      const event =
        eventRaw && typeof eventRaw === "object" && !Array.isArray(eventRaw)
          ? (eventRaw as {
              id: string;
              title: string;
              sport: string;
              region: string;
              event_date: string;
              event_type: string;
              max_participants: number | null;
              recruitment_closed: boolean;
              registration_deadline: string | null;
              status: string;
            })
          : null;

      if (!event) return { ...item, event: null, recruitmentStatus: null };

      const { count } = await getApprovedCountForEvent(event.id);
      const recruitmentStatus = getEventRecruitmentStatus({
        eventDate: event.event_date,
        maxParticipants: event.max_participants,
        approvedCount: count,
        recruitmentClosed: event.recruitment_closed,
        registrationDeadline: event.registration_deadline,
        eventStatus: event.status,
      });

      return { ...item, event, recruitmentStatus };
    }),
  );

  return enriched;
}
