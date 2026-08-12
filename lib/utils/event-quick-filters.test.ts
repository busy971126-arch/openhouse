import { describe, expect, it } from "vitest";
import {
  getMonthDateRange,
  getQuickFilterDateRange,
  getWeekDateRange,
  getWeekendDateRange,
} from "@/lib/utils/event-quick-filters";
import { toDateString } from "@/lib/utils/date";

describe("event-quick-filters", () => {
  it("returns today for today quick filter", () => {
    const result = getQuickFilterDateRange("today");
    expect(result?.single).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns monday to sunday for week filter", () => {
    const wednesday = new Date(2026, 7, 12);
    const range = getWeekDateRange(wednesday);

    expect(range.start).toBe("2026-08-10");
    expect(range.end).toBe("2026-08-16");
  });

  it("returns current month range for month filter", () => {
    const reference = new Date(2026, 7, 12);
    const range = getMonthDateRange(reference);

    expect(range.start).toBe("2026-08-01");
    expect(range.end).toBe("2026-08-31");
  });

  it("returns null for nearby", () => {
    expect(getQuickFilterDateRange("nearby")).toBeNull();
  });

  it("builds weekend range from reference date", () => {
    const sunday = new Date(2026, 7, 16);
    const range = getWeekendDateRange(sunday);

    expect(range.start).toBe(toDateString(new Date(2026, 7, 15)));
    expect(range.end).toBe(toDateString(new Date(2026, 7, 16)));
  });
});
