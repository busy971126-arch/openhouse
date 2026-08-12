import { describe, expect, it } from "vitest";
import {
  formatScheduleCountdown,
  formatScheduleWhenLabel,
  getDaysUntil,
  getWeekRange,
  isDateInRange,
} from "@/lib/utils/schedule-display";

describe("schedule-display", () => {
  it("counts days until event", () => {
    expect(getDaysUntil("2026-08-14", "2026-08-12")).toBe(2);
    expect(getDaysUntil("2026-08-12", "2026-08-12")).toBe(0);
  });

  it("formats countdown label", () => {
    expect(formatScheduleCountdown("2026-08-12", "2026-08-12")).toBe("D-0");
    expect(formatScheduleCountdown("2026-08-14", "2026-08-12")).toBe("D-2");
  });

  it("formats when label for today and tomorrow", () => {
    expect(formatScheduleWhenLabel("2026-08-12", "19:00:00", "2026-08-12")).toBe(
      "오늘 19:00",
    );
    expect(formatScheduleWhenLabel("2026-08-13", "19:00:00", "2026-08-12")).toBe(
      "내일 19:00",
    );
  });

  it("checks week range", () => {
    const range = getWeekRange(new Date(2026, 7, 12));
    expect(range.start).toBe("2026-08-10");
    expect(range.end).toBe("2026-08-16");
    expect(isDateInRange("2026-08-12", range)).toBe(true);
    expect(isDateInRange("2026-08-17", range)).toBe(false);
  });
});
