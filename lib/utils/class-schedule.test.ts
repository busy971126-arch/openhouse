import { describe, expect, it } from "vitest";
import {
  addDraftToSchedule,
  expandDraftToEntries,
  formatDaysLabel,
  groupClassSchedule,
  parseClassSchedule,
  serializeClassSchedule,
  deriveOperatingHoursFromSchedule,
} from "./class-schedule";

describe("class-schedule", () => {
  it("expands multi-day draft into per-day entries", () => {
    const entries = expandDraftToEntries({
      days: ["월", "수", "금"],
      className: "일반부",
      start: "19:00",
      end: "20:30",
    });

    expect(entries).toHaveLength(3);
    expect(entries.map((entry) => entry.day)).toEqual(["월", "수", "금"]);
    expect(entries.every((entry) => entry.className === "일반부")).toBe(true);
  });

  it("groups identical slots for display", () => {
    const entries = expandDraftToEntries({
      days: ["월", "화", "수", "목", "금"],
      className: "일반부",
      start: "19:00",
      end: "20:30",
    });

    expect(groupClassSchedule(entries)).toEqual([
      expect.objectContaining({
        days: ["월", "화", "수", "목", "금"],
        className: "일반부",
        start: "19:00",
        end: "20:30",
      }),
    ]);
  });

  it("formats day labels", () => {
    expect(formatDaysLabel(["월", "수", "금"])).toBe("월 · 수 · 금");
  });

  it("round-trips json storage", () => {
    const entries = addDraftToSchedule([], {
      days: ["토"],
      className: "키즈부",
      start: "10:00",
      end: "11:30",
    });

    const stored = serializeClassSchedule(entries);
    expect(parseClassSchedule(stored)).toEqual(entries);
  });

  it("derives operating hours from weekday and weekend schedules", () => {
    const entries = [
      ...expandDraftToEntries({
        days: ["월", "화", "수", "목", "금"],
        className: "일반부",
        start: "20:00",
        end: "21:30",
      }),
      ...expandDraftToEntries({
        days: ["토"],
        className: "키즈부",
        start: "10:00",
        end: "12:00",
      }),
    ];

    expect(deriveOperatingHoursFromSchedule(entries)).toBe(
      "평일 20:00 ~ 21:30, 주말 10:00 ~ 12:00",
    );
  });

  it("uses min start and max end within the same bucket", () => {
    const entries = [
      ...expandDraftToEntries({
        days: ["월"],
        className: "A",
        start: "19:00",
        end: "20:00",
      }),
      ...expandDraftToEntries({
        days: ["수"],
        className: "B",
        start: "18:00",
        end: "21:30",
      }),
    ];

    expect(deriveOperatingHoursFromSchedule(entries)).toBe(
      "평일 18:00 ~ 21:30",
    );
  });
});
