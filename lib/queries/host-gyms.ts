import { createClient } from "@/lib/supabase/server";
import type { Gym } from "@/lib/types/database";

export async function verifyHostOwnsGym(
  userId: string,
  gymId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("gyms")
    .select("id")
    .eq("id", gymId)
    .eq("owner_id", userId)
    .maybeSingle();

  return !!data;
}

export async function getHostGymById(
  userId: string,
  gymId: string,
): Promise<Gym | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("gyms")
    .select("*")
    .eq("id", gymId)
    .eq("owner_id", userId)
    .maybeSingle();

  return data;
}

export async function getHostGymsWithDetails(userId: string): Promise<Gym[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("gyms")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
