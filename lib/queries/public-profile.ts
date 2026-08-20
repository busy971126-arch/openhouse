import { createClient } from "@/lib/supabase/server";
import { getProfileStats, type ProfileStats } from "@/lib/queries/profile";
import type { Gym } from "@/lib/types/database";
import { PUBLIC_GYM_SELECT } from "@/lib/queries/gym-select";
import {
  applyPrivateContactToGym,
  fetchGymPrivateContact,
} from "@/lib/queries/gym-private-contacts";

export type PublicProfile = {
  id: string;
  display_name: string | null;
  nickname: string | null;
  gender: string | null;
  experience: string | null;
  weight_class: string | null;
  regions: string[] | null;
  preferred_sports: string[] | null;
  photo_url: string | null;
  bio: string | null;
  created_at: string;
  visibility_settings?: Record<string, unknown> | null;
};

export type PublicProfileData = {
  profile: PublicProfile;
  stats: ProfileStats;
  primaryGym: Gym | null;
};

export async function getPublicProfile(
  userId: string,
): Promise<PublicProfileData | null> {
  const supabase = await createClient();

  const [{ data: profileJson }, stats, { data: gyms }] = await Promise.all([
    supabase.rpc("get_public_profile", { p_user_id: userId }),
    getProfileStats(userId),
    supabase
      .from("gyms")
      .select(PUBLIC_GYM_SELECT)
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (!profileJson || typeof profileJson !== "object") return null;

  const profile = profileJson as PublicProfile;
  if (!profile.id) return null;

  const primaryGymRow = gyms?.[0] ?? null;
  const privateContact = primaryGymRow
    ? await fetchGymPrivateContact(supabase, primaryGymRow.id)
    : null;

  return {
    profile,
    stats,
    primaryGym: primaryGymRow
      ? applyPrivateContactToGym(primaryGymRow, privateContact)
      : null,
  };
}
