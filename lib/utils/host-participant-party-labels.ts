import {
  formatPartyCompanionLabel,
} from "@/lib/utils/participant-party";
import type { ParticipantItem } from "@/lib/utils/participant-items";

export function buildPartyCompanionLabelsByRegistrationId(
  registrations: ParticipantItem[],
): Map<string, string[]> {
  const byParty = new Map<string, ParticipantItem[]>();

  for (const registration of registrations) {
    if (!registration.partyId) continue;
    const members = byParty.get(registration.partyId) ?? [];
    members.push(registration);
    byParty.set(registration.partyId, members);
  }

  const labelsByRegistrationId = new Map<string, string[]>();

  for (const members of byParty.values()) {
    for (const member of members) {
      const companionLabels = members
        .filter((other) => other.id !== member.id)
        .map((other) => formatPartyCompanionLabel(other));
      labelsByRegistrationId.set(member.id, companionLabels);
    }
  }

  return labelsByRegistrationId;
}
