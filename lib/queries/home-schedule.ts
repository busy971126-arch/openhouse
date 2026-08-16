import { createClient } from "@/lib/supabase/server";
import { getTodayDateString } from "@/lib/utils/date";
import { getWeekRange, isDateInRange } from "@/lib/utils/schedule-display";
import type { RegistrationStatus } from "@/lib/types/database";

export type HomeScheduleItem = {
  id: string;
  eventId: string;
  status: RegistrationStatus;
  title: string;
  eventDate: string;
  eventTime: string | null;
  sport: string;
  region: string;
};

export type HomeSchedulePreview = {
  today: HomeScheduleItem[];
  thisWeekCount: number;
  next: HomeScheduleItem | null;
  upcoming: HomeScheduleItem[];
};

export async function getUserHomeSchedule(
  userId: string,
): Promise<HomeSchedulePreview> {
  const supabase = await createClient();
  const today = getTodayDateString();
  const weekRange = getWeekRange();

  const { data, error } = await supabase
    .from("registrations")
    .select(
      "id, status, event_id, events(title, event_date, event_time, sport, region)",
    )
    .eq("user_id", userId)
    .in("status", ["pending", "approved"]);

  if (error || !data?.length) {
    return {
      today: [],
      thisWeekCount: 0,
      next: null,
      upcoming: [],
    };
  }

  const upcoming = data
    .map((reg) => {
      const eventRaw = reg.events;
      const event = (
        Array.isArray(eventRaw) ? eventRaw[0] : eventRaw
      ) as {
        title: string;
        event_date: string;
        event_time: string | null;
        sport: string;
        region: string;
      } | null;

      if (!event || event.event_date < today) return null;

      return {
        id: reg.id,
        eventId: reg.event_id,
        status: reg.status as RegistrationStatus,
        title: event.title,
        eventDate: event.event_date,
        eventTime: event.event_time,
        sport: event.sport,
        region: event.region,
      };
    })
    .filter((item): item is HomeScheduleItem => item != null)
    .sort((a, b) => {
      if (a.eventDate !== b.eventDate) {
        return a.eventDate.localeCompare(b.eventDate);
      }
      return (a.eventTime ?? "").localeCompare(b.eventTime ?? "");
    });

  const todayItems = upcoming.filter((item) => item.eventDate === today);
  const thisWeekCount = upcoming.filter((item) =>
    isDateInRange(item.eventDate, weekRange),
  ).length;

  return {
    today: todayItems,
    thisWeekCount,
    next: upcoming[0] ?? null,
    upcoming,
  };
}
