import { describe, expect, it } from "vitest";
import { matchesRecruitmentFilter } from "@/lib/constants/event-recruitment-filter";

describe("matchesRecruitmentFilter", () => {
  it("shows non-ended events for all filter", () => {
    expect(matchesRecruitmentFilter("recruiting", "all")).toBe(true);
    expect(matchesRecruitmentFilter("closing_soon", "all")).toBe(true);
    expect(matchesRecruitmentFilter("closed", "all")).toBe(true);
    expect(matchesRecruitmentFilter("ended", "all")).toBe(false);
  });

  it("filters recruiting only", () => {
    expect(matchesRecruitmentFilter("recruiting", "recruiting")).toBe(true);
    expect(matchesRecruitmentFilter("closing_soon", "recruiting")).toBe(false);
  });

  it("filters closing soon only", () => {
    expect(matchesRecruitmentFilter("closing_soon", "closing_soon")).toBe(true);
    expect(matchesRecruitmentFilter("recruiting", "closing_soon")).toBe(false);
  });
});
