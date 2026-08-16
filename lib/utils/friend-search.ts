import type {
  FriendListItem,
  FriendshipState,
} from "@/lib/queries/friends";

export function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

export function formatFriendProfileLabel(
  nickname: string | null | undefined,
  displayName: string | null | undefined,
): string {
  return nickname?.trim() || displayName?.trim() || "회원";
}

export function formatFriendProfileSubtitle(
  nickname: string | null | undefined,
  displayName: string | null | undefined,
  sport: string | null,
  weightClass: string | null,
): string {
  const parts: string[] = [];

  if (nickname?.trim() && displayName?.trim()) {
    parts.push(displayName.trim());
  }
  if (sport) parts.push(sport);
  if (weightClass) parts.push(weightClass);

  return parts.join(" · ") || "회원";
}

export function filterFriendsByQuery(
  friends: FriendListItem[],
  query: string,
): FriendListItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return friends;

  return friends.filter((friend) => {
    const haystack = [
      friend.nickname,
      friend.displayName,
      friend.sport,
      friend.weightClass,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

type FriendshipRow = {
  requester_id: string;
  addressee_id: string;
  status: string;
};

export function resolveFriendshipStateFromRows(
  viewerId: string,
  targetId: string,
  rows: FriendshipRow[],
): FriendshipState {
  if (viewerId === targetId) return "self";

  const data =
    rows.find(
      (row) =>
        row.status !== "rejected" &&
        ((row.requester_id === viewerId && row.addressee_id === targetId) ||
          (row.requester_id === targetId && row.addressee_id === viewerId)),
    ) ?? null;

  if (!data) return "none";
  if (data.status === "accepted") return "friends";
  if (data.requester_id === viewerId) return "pending_sent";
  return "pending_received";
}

export function buildFriendshipPairsFilter(
  viewerId: string,
  targetIds: string[],
): string | null {
  if (targetIds.length === 0) return null;

  return targetIds
    .map(
      (targetId) =>
        `and(requester_id.eq.${viewerId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${viewerId})`,
    )
    .join(",");
}
