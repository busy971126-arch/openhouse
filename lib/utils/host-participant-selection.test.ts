import { describe, expect, it } from "vitest";
import {
  buildRegistrationStatusMap,
  filterRegistrationIdsByStatus,
  getPartyGroupRegistrationIds,
} from "@/lib/utils/host-participant-selection";
import type { ParticipantItem } from "@/lib/utils/participant-items";

function makeParticipant(
  id: string,
  status: ParticipantItem["status"],
): ParticipantItem {
  return {
    id,
    userId: `user-${id}`,
    displayName: "테스트",
    nickname: null,
    gender: null,
    ageGroup: null,
    weightClass: "-73kg",
    experience: null,
    gymAffiliation: null,
    applicantNotes: null,
    seekingSparring: false,
    phone: null,
    parentPhone: null,
    regions: null,
    preferredSports: null,
    status,
    autoApproved: false,
    operatorMemo: null,
    partyId: null,
    partyRepresentativeUserId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("host-participant-selection", () => {
  it("collects party group registration ids", () => {
    const ids = getPartyGroupRegistrationIds({
      key: "leader",
      leader: makeParticipant("leader", "pending"),
      companions: [makeParticipant("companion", "pending")],
    });

    expect(ids).toEqual(["leader", "companion"]);
  });

  it("filters ids by registration status", () => {
    const statusMap = buildRegistrationStatusMap([
      makeParticipant("a", "pending"),
      makeParticipant("b", "approved"),
    ]);

    expect(
      filterRegistrationIdsByStatus(["a", "b"], statusMap, ["pending"]),
    ).toEqual(["a"]);
  });
});
