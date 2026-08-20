import { createClient } from "@/lib/supabase/server";
import type { Gym } from "@/lib/types/database";
import { PUBLIC_GYM_SELECT } from "@/lib/queries/gym-select";
import {
  applyPrivateContactToGym,
  fetchGymPrivateContact,
  fetchGymPrivateContactsByGymIds,
} from "@/lib/queries/gym-private-contacts";

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
    .select(PUBLIC_GYM_SELECT)
    .eq("id", gymId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (!data) return null;

  const contact = await fetchGymPrivateContact(supabase, gymId);
  return applyPrivateContactToGym(data, contact);
}

export async function getHostGymsWithDetails(userId: string): Promise<Gym[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("gyms")
    .select(PUBLIC_GYM_SELECT)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  const gyms = data ?? [];
  const contacts = await fetchGymPrivateContactsByGymIds(
    supabase,
    gyms.map((gym) => gym.id),
  );

  return gyms.map((gym) =>
    applyPrivateContactToGym(gym, contacts.get(gym.id) ?? null),
  );
}
