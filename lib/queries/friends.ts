import { createClient } from "@/lib/supabase/server";

export type FriendshipState =
  | "none"
  | "self"
  | "friends"
  | "pending_sent"
  | "pending_received";

export type FriendListItem = {
  friendshipId: string;
  userId: string;
  nickname: string;
  sport: string | null;
  photoUrl: string | null;
  weightClass: string | null;
};

export type FriendRequestItem = {
  friendshipId: string;
  userId: string;
  nickname: string;
  sport: string | null;
  photoUrl: string | null;
  createdAt: string;
};

export async function getFriendshipState(
  viewerId: string,
  targetId: string,
): Promise<FriendshipState> {
  if (viewerId === targetId) return "self";

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id, status")
    .or(
      `and(requester_id.eq.${viewerId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${viewerId})`,
    );

  const data = rows?.find((row) => row.status !== "rejected") ?? null;
  if (!data) return "none";
  if (data.status === "accepted") return "friends";
  if (data.requester_id === viewerId) return "pending_sent";
  return "pending_received";
}

export async function getFriendCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("friendships")
    .select("*", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error) return 0;
  return count ?? 0;
}

function mapProfileRow(
  profile: {
    id: string;
    nickname: string | null;
    display_name: string | null;
    preferred_sports: string[] | null;
    photo_url: string | null;
    weight_class: string | null;
  },
  friendshipId: string,
): FriendListItem {
  return {
    friendshipId,
    userId: profile.id,
    nickname:
      profile.nickname?.trim() ||
      profile.display_name?.trim() ||
      "회원",
    sport: profile.preferred_sports?.[0] ?? null,
    photoUrl: profile.photo_url,
    weightClass: profile.weight_class,
  };
}

export async function getFriendsList(userId: string): Promise<FriendListItem[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !rows?.length) return [];

  const friendIds = rows.map((row) =>
    row.requester_id === userId ? row.addressee_id : row.requester_id,
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, nickname, display_name, preferred_sports, photo_url, weight_class",
    )
    .in("id", friendIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return rows
    .map((row) => {
      const friendId =
        row.requester_id === userId ? row.addressee_id : row.requester_id;
      const profile = profileMap.get(friendId);
      if (!profile) return null;
      return mapProfileRow(profile, row.id);
    })
    .filter((item): item is FriendListItem => item != null);
}

export async function getIncomingFriendRequests(
  userId: string,
): Promise<FriendRequestItem[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("friendships")
    .select("id, created_at, requester_id")
    .eq("addressee_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !rows?.length) return [];

  const requesterIds = rows.map((row) => row.requester_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nickname, display_name, preferred_sports, photo_url")
    .in("id", requesterIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return rows
    .map((row) => {
      const profile = profileMap.get(row.requester_id);
      if (!profile) return null;
      return {
        friendshipId: row.id,
        userId: profile.id,
        nickname:
          profile.nickname?.trim() ||
          profile.display_name?.trim() ||
          "회원",
        sport: profile.preferred_sports?.[0] ?? null,
        photoUrl: profile.photo_url,
        createdAt: row.created_at,
      };
    })
    .filter((item): item is FriendRequestItem => item != null);
}

export async function getFriendshipIdForUsers(
  viewerId: string,
  targetId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("friendships")
    .select("id")
    .or(
      `and(requester_id.eq.${viewerId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${viewerId})`,
    )
    .eq("status", "accepted")
    .maybeSingle();

  return data?.id ?? null;
}
