import { createClient } from "@/lib/supabase/server";
import type { ProfileVisibilityLevel } from "@/lib/constants/profile-visibility";
import type { ProfileVisibilityField } from "@/lib/constants/profile-visibility";
import {
  parseProfileVisibilitySettings,
  type ProfileViewContext,
} from "@/lib/utils/profile-visibility";

export async function getAcceptedFriendIdsForViewer(
  viewerId: string,
  targetIds: string[],
): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${viewerId},addressee_id.eq.${viewerId}`);

  const friendIds = new Set<string>();

  for (const row of rows ?? []) {
    const friendId =
      row.requester_id === viewerId ? row.addressee_id : row.requester_id;
    if (targetIds.includes(friendId)) {
      friendIds.add(friendId);
    }
  }

  return friendIds;
}

export async function getProfileVisibilitySettingsMap(
  userIds: string[],
): Promise<Map<string, Record<ProfileVisibilityField, ProfileVisibilityLevel>>> {
  if (userIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data: rows } = await supabase.rpc("get_profile_visibility_settings", {
    p_user_ids: userIds,
  });

  type VisibilityRow = { id: string; visibility_settings: unknown };

  return new Map(
    ((rows ?? []) as VisibilityRow[]).map((row) => [
      row.id,
      parseProfileVisibilitySettings(row.visibility_settings),
    ]),
  );
}

export function getViewContextForTarget(
  viewerId: string | null | undefined,
  targetUserId: string,
  friendIds: Set<string>,
): ProfileViewContext {
  if (!viewerId) return "other";
  if (viewerId === targetUserId) return "self";
  if (friendIds.has(targetUserId)) return "friend";
  return "other";
}
