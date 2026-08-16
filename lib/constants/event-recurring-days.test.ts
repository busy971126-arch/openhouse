import { describe, expect, it } from "vitest";
import {
  formatRecurringDaysLabel,
  normalizeRecurringDays,
  serializeRecurringDays,
  toggleRecurringDay,
} from "@/lib/constants/event-recurring-days";

describe("event-recurring-days", () => {
  it("normalizes and sorts weekday codes", () => {
    expect(normalizeRecurringDays(["fri", "mon", "invalid", "mon"])).toEqual([
      "mon",
      "fri",
    ]);
  });

  it("serializes empty selection as null", () => {
    expect(serializeRecurringDays([])).toBeNull();
    expect(serializeRecurringDays(["sat"])).toEqual(["sat"]);
  });

  it("formats selected days for display", () => {
    expect(formatRecurringDaysLabel(["mon", "wed", "fri"])).toBe("월 · 수 · 금");
    expect(formatRecurringDaysLabel(null)).toBeNull();
  });

  it("toggles day selection", () => {
    expect(toggleRecurringDay(["mon"], "wed")).toEqual(["mon", "wed"]);
    expect(toggleRecurringDay(["mon", "wed"], "mon")).toEqual(["wed"]);
  });
});
