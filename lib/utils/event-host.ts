import type { Event, Gym } from "@/lib/types/database";

type EventHostCheckInput = Pick<Event, "created_by"> & {
  gyms?: Pick<Gym, "owner_id"> | null;
};

export function isEventHost(
  userId: string | null | undefined,
  event: EventHostCheckInput,
): boolean {
  if (!userId) return false;
  if (event.created_by === userId) return true;
  return event.gyms?.owner_id === userId;
}
