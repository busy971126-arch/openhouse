import { describe, expect, it } from "vitest";
import {
  formatOperatingHoursDisplay,
  parseOperatingHours,
  serializeOperatingHours,
} from "./operating-hours";

describe("operating-hours", () => {
  it("serializes weekday and weekend slots", () => {
    expect(
      serializeOperatingHours({
        weekday: { start: "18:00", end: "22:00" },
        weekend: { start: "10:00", end: "15:00" },
      }),
    ).toBe("weekday:18:00-22:00|weekend:10:00-15:00");
  });

  it("round-trips parsed values", () => {
    const raw = "weekday:18:00-22:00|weekend:10:00-15:00";
    expect(serializeOperatingHours(parseOperatingHours(raw))).toBe(raw);
  });

  it("formats for display", () => {
    expect(
      formatOperatingHoursDisplay("weekday:18:00-22:00|weekend:10:00-15:00"),
    ).toBe("평일 18:00 ~ 22:00\n주말 10:00 ~ 15:00");
  });
});
