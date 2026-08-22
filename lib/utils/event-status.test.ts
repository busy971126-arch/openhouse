import { describe, expect, it } from "vitest";
import {
  getEventRecruitmentStatus,
  getRegistrationApplyBlockMessage,
  isEventAtCapacity,
} from "./event-status";

describe("getEventRecruitmentStatus", () => {
  const futureDate = "2099-12-31";
  const pastDate = "2020-01-01";

  it("returns ended for past events", () => {
    expect(
      getEventRecruitmentStatus({
        eventDate: pastDate,
        maxParticipants: 10,
        approvedCount: 0,
      }),
    ).toBe("ended");
  });

  it("returns closed when admin recruitment is paused", () => {
    expect(
      getEventRecruitmentStatus({
        eventDate: futureDate,
        maxParticipants: 10,
        approvedCount: 0,
        adminRecruitmentPaused: true,
      }),
    ).toBe("closed");
  });

  it("returns closed when recruitment_closed is true", () => {
    expect(
      getEventRecruitmentStatus({
        eventDate: futureDate,
        maxParticipants: 10,
        approvedCount: 0,
        recruitmentClosed: true,
      }),
    ).toBe("closed");
  });

  it("returns closed when at capacity (pending + approved)", () => {
    expect(
      getEventRecruitmentStatus({
        eventDate: futureDate,
        maxParticipants: 5,
        approvedCount: 5,
      }),
    ).toBe("closed");
  });

  it("returns closed when pending fills remaining spots", () => {
    expect(
      getEventRecruitmentStatus({
        eventDate: futureDate,
        maxParticipants: 10,
        approvedCount: 10,
      }),
    ).toBe("closed");
  });

  it("returns closing_soon when 3 or fewer spots left", () => {
    expect(
      getEventRecruitmentStatus({
        eventDate: futureDate,
        maxParticipants: 10,
        approvedCount: 8,
      }),
    ).toBe("closing_soon");
  });

  it("returns closed when registration deadline passed", () => {
    expect(
      getEventRecruitmentStatus({
        eventDate: futureDate,
        maxParticipants: 10,
        approvedCount: 0,
        registrationDeadline: "2020-01-01",
      }),
    ).toBe("closed");
  });

  it("returns closed when event is cancelled", () => {
    expect(
      getEventRecruitmentStatus({
        eventDate: futureDate,
        maxParticipants: 10,
        approvedCount: 0,
        eventStatus: "cancelled",
      }),
    ).toBe("closed");
  });

  it("returns recruiting otherwise", () => {
    expect(
      getEventRecruitmentStatus({
        eventDate: futureDate,
        maxParticipants: 10,
        approvedCount: 2,
      }),
    ).toBe("recruiting");
  });

  it("does not treat unavailable counts as zero capacity", () => {
    expect(
      getEventRecruitmentStatus({
        eventDate: futureDate,
        maxParticipants: 5,
        approvedCount: null,
      }),
    ).toBe("recruiting");
    expect(isEventAtCapacity(5, null)).toBe(false);
    expect(isEventAtCapacity(5, 5)).toBe(true);
  });
});

describe("getRegistrationApplyBlockMessage", () => {
  const today = "2026-08-20";

  it("allows today and future deadlines and null deadline", () => {
    expect(
      getRegistrationApplyBlockMessage({
        status: "active",
        recruitment_closed: false,
        registration_deadline: "2026-08-21",
        today,
      }),
    ).toBeNull();
    expect(
      getRegistrationApplyBlockMessage({
        status: "active",
        recruitment_closed: false,
        registration_deadline: today,
        today,
      }),
    ).toBeNull();
    expect(
      getRegistrationApplyBlockMessage({
        status: "active",
        recruitment_closed: false,
        registration_deadline: null,
        today,
      }),
    ).toBeNull();
  });

  it("blocks past deadline, closed recruitment, and cancelled status", () => {
    expect(
      getRegistrationApplyBlockMessage({
        status: "active",
        recruitment_closed: false,
        registration_deadline: "2026-08-19",
        today,
      }),
    ).toBe("신청이 마감된 이벤트입니다.");
    expect(
      getRegistrationApplyBlockMessage({
        status: "active",
        recruitment_closed: true,
        registration_deadline: null,
        today,
      }),
    ).toBe("신청이 마감된 이벤트입니다.");
    expect(
      getRegistrationApplyBlockMessage({
        status: "cancelled",
        recruitment_closed: false,
        registration_deadline: null,
        today,
      }),
    ).toBe("취소된 이벤트입니다.");

    expect(
      getRegistrationApplyBlockMessage({
        status: "active",
        recruitment_closed: false,
        admin_recruitment_paused: true,
        registration_deadline: null,
        event_date: "2099-12-31",
        today,
      }),
    ).toBe("신청이 마감된 이벤트입니다.");
  });
});
