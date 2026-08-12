import { describe, expect, it } from "vitest";
import { getGymCardBadges } from "./gym-card-badges";
import { MAX_GYM_CARD_FACILITY_BADGES } from "@/lib/constants/gym-search";

describe("getGymCardBadges", () => {
  it("shows beginner welcome and limits badge count", () => {
    const badges = getGymCardBadges({
      first_visit_welcome: true,
      facilities: ["샤워실", "탈의실", "정수기", "냉·난방", "주차:무료"],
      facility_notes: null,
    });

    expect(badges[0]).toEqual({
      key: "beginner",
      label: "초보 환영",
      icon: "🟢",
    });
    expect(badges.length).toBeLessThanOrEqual(MAX_GYM_CARD_FACILITY_BADGES);
  });
});
