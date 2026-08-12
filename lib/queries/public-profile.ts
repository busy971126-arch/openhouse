import { createClient } from "@/lib/supabase/server";
import { getProfileStats, type ProfileStats } from "@/lib/queries/profile";
import type { Gym } from "@/lib/types/database";

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
};

export type PublicProfileData = {
  profile: PublicProfile;
  stats: ProfileStats;
  primaryGym: Gym | null;
};

const PUBLIC_PROFILE_FIELDS =
  "id, display_name, nickname, gender, experience, weight_class, regions, preferred_sports, photo_url, bio, created_at";

export async function getPublicProfile(
  userId: string,
): Promise<PublicProfileData | null> {
  const supabase = await createClient();

  const [{ data: profile }, stats, { data: gyms }] = await Promise.all([
    supabase
      .from("profiles")
      .select(PUBLIC_PROFILE_FIELDS)
      .eq("id", userId)
      .maybeSingle(),
    getProfileStats(userId),
    supabase
      .from("gyms")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (!profile) return null;

  return {
    profile: profile as PublicProfile,
    stats,
    primaryGym: (gyms?.[0] as Gym | undefined) ?? null,
  };
}
