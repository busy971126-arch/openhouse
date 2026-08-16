import { describe, expect, it } from "vitest";
import {
  formatClosingTodayHint,
  formatNearbyEventLabel,
  isClosingTodayEvent,
  isStartingThisWeekEvent,
} from "@/lib/utils/home-events";

describe("home-events", () => {
  const baseEvent = {
    id: "1",
    gym_id: "g1",
    created_by: "u1",
    title: "부천 오픈매트",
    description: null,
    event_type: "open_mat" as const,
    sport: "유도",
    region: "경기 부천시",
    address: null,
    recurring_days: null,
    event_date: "2026-08-16",
    event_time: "19:00:00",
    max_participants: 40,
    fee_amount: null,
    registration_deadline: "2026-08-12",
    difficulty: null,
    recruitment_closed: false,
    safety_rules: null,
    prohibited_techniques: null,
    requirements: null,
    safety_notes: null,
    emergency_contact: null,
    gi_rental: null,
    visit_details: null,
    created_at: "2026-08-01",
    gyms: { name: "OpenHouse Judo", region: "경기 부천시", photo_url: null, owner_id: "u1" },
  } satisfies import("@/lib/types/database").EventWithGym;

  it("detects closing today events", () => {
    expect(isClosingTodayEvent(baseEvent, 10, "2026-08-12")).toBe(true);
    expect(isClosingTodayEvent(baseEvent, 10, "2026-08-13")).toBe(false);
  });

  it("detects events starting this week", () => {
    expect(isStartingThisWeekEvent(baseEvent, 10, "2026-08-12")).toBe(true);
    expect(
      isStartingThisWeekEvent(
        { ...baseEvent, event_date: "2026-08-20" },
        10,
        "2026-08-12",
      ),
    ).toBe(false);
  });

  it("formats nearby labels", () => {
    expect(formatNearbyEventLabel("경기 부천시", ["경기 부천시"])).toBe(
      "내 지역",
    );
    expect(formatNearbyEventLabel("경기 부천시", ["경기 수원시"])).toBe(
      "인근 지역",
    );
  });

  it("formats closing hint", () => {
    expect(formatClosingTodayHint("2026-08-12", "2026-08-12")).toBe(
      "오늘까지 신청",
    );
  });
});
