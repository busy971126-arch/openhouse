import { createClient } from "@/lib/supabase/server";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export async function getUserNotifications(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return { data: [], error };
  }

  return { data: data as NotificationRow[], error: null };
}

export async function getHomeNotificationPreview(userId: string) {
  const supabase = await createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: unread, error: unreadError } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (unreadError) {
    return { notification: null, unreadCount: 0, error: unreadError };
  }

  const { count: unreadCount } = await getUnreadNotificationCount(userId);

  if (unread) {
    return {
      notification: unread as NotificationRow,
      unreadCount,
      error: null,
    };
  }

  const { data: todayNotification, error: todayError } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (todayError) {
    return { notification: null, unreadCount, error: todayError };
  }

  return {
    notification: (todayNotification as NotificationRow | null) ?? null,
    unreadCount,
    error: null,
  };
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    return { count: 0, error };
  }

  return { count: count ?? 0, error: null };
}
