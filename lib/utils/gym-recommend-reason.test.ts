import { describe, expect, it } from "vitest";
import { formatGymRecommendReason } from "@/lib/utils/gym-recommend-reason";
import { getHomeEventBadges } from "@/lib/utils/home-events";
import type { EventWithGym } from "@/lib/types/database";

function makeItem(overrides: Partial<EventWithGym> = {}, approvedCount = 5) {
  const event = {
    id: "e1",
    gym_id: "g1",
    created_by: "u1",
    title: "Test",
    description: null,
    event_type: "open_mat" as const,
    sport: "유도",
    region: "서울",
    address: null,
    recurring_days: null,
    event_date: "2026-08-20",
    event_time: "19:00:00",
    max_participants: 20,
    recruitment_closed: false,
    registration_deadline: null,
    fee_amount: null,
    difficulty: "beginner" as const,
    safety_rules: null,
    prohibited_techniques: null,
    requirements: null,
    safety_notes: null,
    emergency_contact: null,
    gi_rental: null,
    visit_details: null,
    created_at: "",
    gyms: null,
    ...overrides,
  } satisfies EventWithGym;

  return { event, approvedCount };
}

describe("getHomeEventBadges", () => {
  it("shows beginner welcome badge", () => {
    const badges = getHomeEventBadges(makeItem({ difficulty: "beginner" }));
    expect(badges).toContain("초보 환영");
  });

  it("shows closing soon when few spots remain", () => {
    const badges = getHomeEventBadges(
      makeItem({ max_participants: 20 }, 18),
    );
    expect(badges).toContain("마감 임박");
  });
});

describe("formatGymRecommendReason", () => {
  it("prioritizes profile region match", () => {
    expect(
      formatGymRecommendReason(
        { region: "서울", sport: "유도", upcomingEventCount: 2 },
        ["서울"],
      ),
    ).toBe("내 지역 · 예정 이벤트 2개");
  });
});
