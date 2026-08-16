export function buildHostParticipantsUrl(
  gymId: string,
  eventId?: string | null,
): string {
  const params = new URLSearchParams({ gym: gymId });
  if (eventId) params.set("event", eventId);
  return `/host/participants?${params.toString()}`;
}
