import { describe, expect, it } from "vitest";
import {
  bucketScheduleByTab,
  getDefaultScheduleTabForEventDate,
  parseMyScheduleTab,
} from "@/lib/utils/my-schedule";

describe("my-schedule", () => {
  const items = [
    { id: "1", eventDate: "2026-08-12", status: "approved" },
    { id: "2", eventDate: "2026-08-14", status: "pending" },
    { id: "3", eventDate: "2026-08-05", status: "approved" },
    { id: "4", eventDate: "2026-08-20", status: "approved" },
    { id: "5", eventDate: "2026-08-16", status: "cancelled" },
  ];

  it("parses tab query", () => {
    expect(parseMyScheduleTab("today")).toBe("today");
    expect(parseMyScheduleTab("invalid")).toBe("today");
  });

  it("buckets today, week, and past", () => {
    const buckets = bucketScheduleByTab(items, "2026-08-12");
    expect(buckets.today.map((item) => item.id)).toEqual(["1"]);
    expect(buckets.week.map((item) => item.id)).toEqual(["2"]);
    expect(buckets.past.map((item) => item.id)).toEqual(["5", "3"]);
  });

  it("picks default tab from event date", () => {
    expect(getDefaultScheduleTabForEventDate("2026-08-12", "2026-08-12")).toBe(
      "today",
    );
    expect(getDefaultScheduleTabForEventDate("2026-08-14", "2026-08-12")).toBe(
      "week",
    );
  });
});
