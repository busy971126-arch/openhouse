import { describe, expect, it } from "vitest";
import { getEventRecruitmentStatus } from "./event-status";

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
});
