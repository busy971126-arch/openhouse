import { describe, expect, it } from "vitest";
import { sortGyms } from "./gym-search";
import type { GymWithEventCount } from "@/lib/queries/gyms";

function gym(
  partial: Partial<GymWithEventCount> & Pick<GymWithEventCount, "id" | "name">,
): GymWithEventCount {
  return {
    owner_id: "u1",
    sport: "유도",
    region: "경기",
    address: null,
    representative_name: null,
    representative_phone: null,
    representative_role: null,
    representative_role_custom: null,
    photo_url: null,
    description: null,
    phone: null,
    instagram_url: null,
    homepage_url: null,
    sns_url: null,
    operating_hours: null,
    class_schedule: null,
    closed_days: null,
    facilities: null,
    facility_notes: null,
    first_visit_welcome: null,
    walk_in_visits: null,
    gi_rental: null,
    visit_details: null,
    preparation_guide: null,
    training_styles: null,
    gym_tags: null,
    mat_photos: null,
    facility_photos: null,
    exterior_photos: null,
    parking_photos: null,
    is_public: true,
    created_at: "2026-01-01T00:00:00.000Z",
    upcomingEventCount: 0,
    upcomingEvents: [],
    ...partial,
  };
}

describe("sortGyms", () => {
  it("sorts by upcoming event count", () => {
    const result = sortGyms(
      [
        gym({ id: "1", name: "A", upcomingEventCount: 1 }),
        gym({ id: "2", name: "B", upcomingEventCount: 3 }),
      ],
      "events",
    );

    expect(result.map((item) => item.id)).toEqual(["2", "1"]);
  });

  it("sorts by name", () => {
    const result = sortGyms(
      [gym({ id: "1", name: "한 gym" }), gym({ id: "2", name: "가 gym" })],
      "name",
    );

    expect(result.map((item) => item.name)).toEqual(["가 gym", "한 gym"]);
  });

  it("sorts by recommended score", () => {
    const result = sortGyms(
      [
        gym({ id: "1", name: "A", upcomingEventCount: 0 }),
        gym({ id: "2", name: "B", upcomingEventCount: 2 }),
      ],
      "recommended",
    );

    expect(result.map((item) => item.id)).toEqual(["2", "1"]);
  });

  it("prioritizes profile regions for distance sort", () => {
    const result = sortGyms(
      [
        gym({ id: "1", name: "A", region: "서울 강남" }),
        gym({ id: "2", name: "B", region: "경기 부천" }),
      ],
      "distance",
      ["경기 부천"],
    );

    expect(result.map((item) => item.id)).toEqual(["2", "1"]);
  });
});
