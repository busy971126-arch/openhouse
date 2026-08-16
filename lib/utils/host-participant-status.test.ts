import { describe, expect, it } from "vitest";
import {
  countActiveHostParticipants,
  countHostParticipantsByTab,
  formatHostParticipantSubline,
  matchesHostParticipantTab,
} from "@/lib/utils/host-participant-status";
import type { ParticipantItem } from "@/lib/utils/participant-items";

function makeParticipant(status: ParticipantItem["status"]): ParticipantItem {
  return {
    id: status,
    userId: null,
    displayName: "테스트",
    nickname: null,
    gender: null,
    ageGroup: null,
    weightClass: null,
    experience: null,
    gymAffiliation: null,
    applicantNotes: null,
    seekingSparring: false,
    phone: null,
    parentPhone: null,
    regions: null,
    preferredSports: null,
    status,
    operatorMemo: null,
    autoApproved: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    partyId: null,
    partyRepresentativeUserId: null,
  };
}

describe("host-participant-status", () => {
  it("maps rejected tab to rejected status only", () => {
    expect(matchesHostParticipantTab("rejected", "rejected")).toBe(true);
    expect(matchesHostParticipantTab("cancelled", "rejected")).toBe(false);
  });

  it("maps cancelled tab to cancelled status only", () => {
    expect(matchesHostParticipantTab("cancelled", "cancelled")).toBe(true);
    expect(matchesHostParticipantTab("rejected", "cancelled")).toBe(false);
  });

  it("counts tab totals including cancelled", () => {
    const counts = countHostParticipantsByTab([
      makeParticipant("pending"),
      makeParticipant("approved"),
      makeParticipant("rejected"),
      makeParticipant("cancelled"),
    ]);

    expect(counts).toEqual({
      all: 4,
      pending: 1,
      approved: 1,
      rejected: 1,
      cancelled: 1,
    });
  });

  it("counts active participants as pending plus approved", () => {
    expect(
      countActiveHostParticipants([
        makeParticipant("pending"),
        makeParticipant("approved"),
        makeParticipant("cancelled"),
      ]),
    ).toBe(2);
  });

  it("formats subline with sport first, experience type, and profile fields", () => {
    expect(
      formatHostParticipantSubline({
        weightClass: "-73kg",
        gender: "남성",
        gymAffiliation: "OO 유도관",
        preferredSports: ["유도"],
        experience: "일반 수련자 · 3~5년",
      }),
    ).toBe("유도 · 일반 · -73kg · 남 · OO 유도관");
  });

  it("formats elite experience as 엘리트", () => {
    expect(
      formatHostParticipantSubline({
        weightClass: "-57kg",
        gender: "여성",
        gymAffiliation: null,
        preferredSports: ["유도"],
        experience: "선수 출신",
      }),
    ).toBe("유도 · 엘리트 · -57kg · 여");
  });
});
