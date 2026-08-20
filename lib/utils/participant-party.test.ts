import { describe, expect, it } from "vitest";
import {
  formatPartyCompanionLabel,
  isPartyLeader,
  organizeParticipantParties,
  parseRegistrationApplyError,
} from "@/lib/utils/participant-party";
import type { ParticipantItem } from "@/lib/utils/participant-items";

function item(
  overrides: Partial<ParticipantItem> & Pick<ParticipantItem, "id">,
): ParticipantItem {
  return {
    userId: "user-1",
    displayName: "홍길동",
    nickname: "타이거",
    gender: null,
    ageGroup: null,
    weightClass: "-73kg",
    experience: "일반 수련자 · 3~5년",
    gymAffiliation: null,
    applicantNotes: null,
    seekingSparring: false,
    phone: null,
    parentPhone: null,
    regions: null,
    preferredSports: null,
    status: "pending",
    autoApproved: false,
    operatorMemo: null,
    createdAt: "2026-08-12T00:00:00.000Z",
    partyId: null,
    partyRepresentativeUserId: null,
    ...overrides,
  };
}

describe("organizeParticipantParties", () => {
  it("groups party members under the representative", () => {
    const leader = item({
      id: "r1",
      userId: "leader",
      partyId: "party-1",
      partyRepresentativeUserId: "leader",
    });
    const companion = item({
      id: "r2",
      userId: "friend",
      nickname: "베어",
      partyId: "party-1",
      partyRepresentativeUserId: "leader",
    });
    const solo = item({ id: "r3", userId: "solo" });

    const groups = organizeParticipantParties([companion, solo, leader]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.leader.id).toBe("r1");
    expect(groups[0]?.companions).toHaveLength(1);
    expect(groups[1]?.leader.id).toBe("r3");
  });
});

describe("isPartyLeader", () => {
  it("returns true for solo registrations", () => {
    expect(isPartyLeader(item({ id: "r1" }))).toBe(true);
  });
});

describe("formatPartyCompanionLabel", () => {
  it("prefers nickname", () => {
    expect(formatPartyCompanionLabel(item({ id: "r1" }))).toBe("타이거");
  });
});

describe("parseRegistrationApplyError", () => {
  it("maps enum status errors to a friendly message", () => {
    expect(
      parseRegistrationApplyError(
        'invalid input value for enum registration_status: ""',
      ),
    ).toContain("037_fix_registration_capacity_trigger.sql");
  });

  it("maps known rpc codes", () => {
    expect(parseRegistrationApplyError("ALREADY_REGISTERED")).toBe(
      "이미 이 이벤트에 신청했습니다.",
    );
    expect(parseRegistrationApplyError("REGISTRATION_CLOSED")).toBe(
      "신청이 마감된 이벤트입니다.",
    );
    expect(parseRegistrationApplyError("EVENT_CANCELLED")).toBe(
      "취소된 이벤트입니다.",
    );
  });

  it("maps missing rpc function errors", () => {
    expect(
      parseRegistrationApplyError(
        "Could not find the function public.create_solo_registration(...) in the schema cache",
      ),
    ).toContain("036_solo_registration_rpc.sql");
  });
});
