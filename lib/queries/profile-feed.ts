import { createClient } from "@/lib/supabase/server";
import {
  buildPhotoFeedItem,
  buildProfileFeedItem,
  type ProfileFeedItem,
} from "@/lib/utils/profile-feed";
import { toDateString } from "@/lib/utils/date";

export type { ProfileFeedItem };

export async function getProfileFeed(
  userId: string,
  limit = 20,
): Promise<ProfileFeedItem[]> {
  const supabase = await createClient();

  const [{ data: registrations }, { data: gyms }, { data: photoPosts }] =
    await Promise.all([
      supabase
        .from("registrations")
        .select("events(title, event_date, event_type)")
        .eq("user_id", userId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("gyms")
        .select("name, created_at")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("profile_feed_posts")
        .select("id, caption, photo_urls, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

  const participated =
    registrations
      ?.map((row) => {
        const event = row.events as {
          title: string;
          event_date: string;
          event_type: string | null;
        } | null;
        if (!event?.event_date || !event.title) return null;
        return buildProfileFeedItem({
          kind: "participate",
          eventDate: event.event_date,
          name: event.title,
          eventType: event.event_type,
        });
      })
      .filter((item): item is ProfileFeedItem => item !== null) ?? [];

  let operated: ProfileFeedItem[] = [];

  if (gyms && gyms.length > 0) {
    const { data: gymRows } = await supabase
      .from("gyms")
      .select("id")
      .eq("owner_id", userId);
    const ids = gymRows?.map((gym) => gym.id) ?? [];

    if (ids.length > 0) {
      const { data: events } = await supabase
        .from("events")
        .select("title, event_date, event_type")
        .in("gym_id", ids)
        .order("event_date", { ascending: false })
        .limit(40);

      operated =
        events
          ?.filter((event) => event.event_date && event.title)
          .map((event) =>
            buildProfileFeedItem({
              kind: "operate",
              eventDate: event.event_date,
              name: event.title,
              eventType: event.event_type,
            }),
          ) ?? [];
    }
  }

  const gymJoined =
    gyms
      ?.filter((gym) => gym.name && gym.created_at)
      .map((gym) =>
        buildProfileFeedItem({
          kind: "gym_join",
          eventDate: toDateString(new Date(gym.created_at)),
          name: gym.name,
        }),
      ) ?? [];

  const photos =
    photoPosts
      ?.filter((post) => post.photo_urls?.length > 0)
      .map((post) =>
        buildPhotoFeedItem({
          id: post.id,
          createdAt: post.created_at,
          caption: post.caption,
          photoUrls: post.photo_urls,
        }),
      ) ?? [];

  return [...participated, ...operated, ...gymJoined, ...photos]
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
    .slice(0, limit);
}

/** @deprecated use getProfileFeed */
export async function getProfileRecentActivity(
  userId: string,
  limit = 3,
): Promise<
  Array<{
    id: string;
    dateLabel: string;
    title: string;
    suffix: "참가" | "운영";
    sortKey: string;
  }>
> {
  const feed = await getProfileFeed(userId, limit);
  return feed.map((item) => ({
    id: item.id,
    dateLabel: item.dateLabel,
    title: item.title.replace(/ (참가|운영|등록|세미나 참가)$/, ""),
    suffix: item.kind === "operate" ? "운영" : "참가",
    sortKey: item.sortKey,
  }));
}
