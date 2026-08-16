import { describe, expect, it } from "vitest";
import type { DashboardEvent } from "@/lib/queries/dashboard";
import {
  findHostPendingEvent,
  getHostNewEventHref,
  getHostParticipantsHref,
  sortHostOperatingEvents,
  splitHostOperatingEvents,
} from "@/lib/utils/host-home";

function makeEvent(
  overrides: Partial<DashboardEvent> & { id: string },
): DashboardEvent {
  return {
    gym_id: "gym-1",
    created_by: "user-1",
    title: "Event",
    description: null,
    event_type: "open_mat",
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
    difficulty: null,
    safety_rules: null,
    prohibited_techniques: null,
    requirements: null,
    safety_notes: null,
    emergency_contact: null,
    gi_rental: null,
    visit_details: null,
    status: "active",
    auto_approve: false,
    created_at: "",
    gyms: { name: "Test Gym", owner_id: "user-1" },
    counts: { approved: 0, pending: 0, total: 0 },
    recruitmentStatus: "recruiting",
    ...overrides,
  };
}

describe("host-home", () => {
  it("sorts pending events first", () => {
    const sorted = sortHostOperatingEvents([
      makeEvent({ id: "1", event_date: "2026-08-12", counts: { approved: 1, pending: 0, total: 1 } }),
      makeEvent({ id: "2", event_date: "2026-08-13", counts: { approved: 0, pending: 2, total: 2 } }),
    ]);

    expect(sorted.map((event) => event.id)).toEqual(["2", "1"]);
  });

  it("splits today and upcoming events", () => {
    const { todayEvents, upcomingEvents } = splitHostOperatingEvents(
      [
        makeEvent({ id: "today", event_date: "2026-08-12" }),
        makeEvent({ id: "later", event_date: "2026-08-20" }),
      ],
      "2026-08-12",
    );

    expect(todayEvents.map((event) => event.id)).toEqual(["today"]);
    expect(upcomingEvents.map((event) => event.id)).toEqual(["later"]);
  });

  it("builds host quick links", () => {
    const events = [
      makeEvent({
        id: "pending",
        gym_id: "gym-a",
        counts: { approved: 1, pending: 1, total: 2 },
      }),
    ];

    expect(getHostParticipantsHref(events, [{ id: "gym-a" }])).toBe(
      "/host/participants?gym=gym-a&event=pending",
    );
    expect(getHostNewEventHref([{ id: "gym-a" }])).toBe(
      "/events/new?gym=gym-a",
    );
  });

  it("links to past event when only past events have pending approvals", () => {
    const events = [
      makeEvent({
        id: "past-pending",
        gym_id: "gym-a",
        event_date: "2026-08-01",
        counts: { approved: 2, pending: 3, total: 5 },
      }),
      makeEvent({
        id: "future-clear",
        gym_id: "gym-a",
        event_date: "2026-08-20",
        counts: { approved: 1, pending: 0, total: 1 },
      }),
    ];

    expect(
      findHostPendingEvent(events, "2026-08-12")?.id,
    ).toBe("past-pending");
    expect(getHostParticipantsHref(events, [{ id: "gym-a" }], "2026-08-12")).toBe(
      "/host/participants?gym=gym-a&event=past-pending",
    );
  });

  it("prefers operating pending event over past pending event", () => {
    const events = [
      makeEvent({
        id: "past-pending",
        gym_id: "gym-a",
        event_date: "2026-08-01",
        counts: { approved: 0, pending: 5, total: 5 },
      }),
      makeEvent({
        id: "today-pending",
        gym_id: "gym-b",
        event_date: "2026-08-12",
        counts: { approved: 0, pending: 1, total: 1 },
      }),
    ];

    expect(findHostPendingEvent(events, "2026-08-12")?.id).toBe("today-pending");
    expect(getHostParticipantsHref(events, [{ id: "gym-a" }], "2026-08-12")).toBe(
      "/host/participants?gym=gym-b&event=today-pending",
    );
  });
});
