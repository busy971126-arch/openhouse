import { describe, expect, it } from "vitest";
import { formatParticipantCount } from "@/lib/utils/event-display";

describe("formatParticipantCount", () => {
  it("formats known counts", () => {
    expect(formatParticipantCount(3, 10)).toBe("신청 3 / 10명");
    expect(formatParticipantCount(0, null)).toBe("신청 0명");
  });

  it("does not display unavailable counts as zero", () => {
    expect(formatParticipantCount(null, 10)).toBe("인원 확인 불가");
  });
});
