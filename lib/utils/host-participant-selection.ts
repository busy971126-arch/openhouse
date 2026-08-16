import type { ParticipantPartyGroup } from "@/lib/utils/participant-party";
import type { ParticipantItem } from "@/lib/utils/participant-items";
import type { RegistrationStatus } from "@/lib/types/database";

export function getPartyGroupRegistrationIds(group: ParticipantPartyGroup): string[] {
  return [group.leader.id, ...group.companions.map((member) => member.id)];
}

export function getAllRegistrationIdsFromGroups(
  groups: ParticipantPartyGroup[],
): string[] {
  return groups.flatMap((group) => getPartyGroupRegistrationIds(group));
}

export function filterRegistrationIdsByStatus(
  ids: string[],
  statusById: Map<string, RegistrationStatus>,
  statuses: RegistrationStatus[],
): string[] {
  const allowed = new Set(statuses);
  return ids.filter((id) => allowed.has(statusById.get(id) ?? "pending"));
}

export function buildRegistrationStatusMap(
  registrations: ParticipantItem[],
): Map<string, RegistrationStatus> {
  return new Map(registrations.map((registration) => [registration.id, registration.status]));
}
