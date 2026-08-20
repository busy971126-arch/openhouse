import type { Gym, GymPrivateContact } from "@/lib/types/database";
import {
  GYM_PRIVATE_CONTACT_SELECT,
  GYM_PRIVATE_CONTACT_WITH_ID_SELECT,
} from "@/lib/queries/gym-select";

export type GymPrivateContactFields = Pick<
  GymPrivateContact,
  | "representative_name"
  | "representative_phone"
  | "representative_role"
  | "representative_role_custom"
>;

type LooseSupabase = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
};

export function applyPrivateContactToGym(
  gym: Omit<
    Gym,
    | "representative_name"
    | "representative_phone"
    | "representative_role"
    | "representative_role_custom"
  > &
    Partial<GymPrivateContactFields>,
  contact: GymPrivateContactFields | null | undefined,
): Gym {
  return {
    ...gym,
    representative_name:
      contact?.representative_name ?? gym.representative_name ?? null,
    representative_phone:
      contact?.representative_phone ?? gym.representative_phone ?? null,
    representative_role:
      contact?.representative_role ?? gym.representative_role ?? null,
    representative_role_custom:
      contact?.representative_role_custom ??
      gym.representative_role_custom ??
      null,
  };
}

export async function fetchGymPrivateContact(
  supabase: LooseSupabase,
  gymId: string,
): Promise<GymPrivateContactFields | null> {
  const { data } = await supabase
    .from("gym_private_contacts")
    .select(GYM_PRIVATE_CONTACT_SELECT)
    .eq("gym_id", gymId)
    .maybeSingle();

  return (data ?? null) as GymPrivateContactFields | null;
}

export async function fetchGymPrivateContactsByGymIds(
  supabase: LooseSupabase,
  gymIds: string[],
): Promise<Map<string, GymPrivateContactFields>> {
  const map = new Map<string, GymPrivateContactFields>();
  if (gymIds.length === 0) return map;

  const { data } = await supabase
    .from("gym_private_contacts")
    .select(GYM_PRIVATE_CONTACT_WITH_ID_SELECT)
    .in("gym_id", gymIds);

  for (const row of (data ?? []) as Array<
    { gym_id: string } & GymPrivateContactFields
  >) {
    map.set(row.gym_id, {
      representative_name: row.representative_name,
      representative_phone: row.representative_phone,
      representative_role: row.representative_role,
      representative_role_custom: row.representative_role_custom,
    });
  }

  return map;
}
