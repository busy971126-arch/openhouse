import { describe, expect, it, vi, afterEach } from "vitest";
import { getGymEventHighlight } from "./gym-event-highlight";

describe("getGymEventHighlight", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows today highlight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T10:00:00"));

    const label = getGymEventHighlight(
      [{ id: "1", title: "부천 오픈매트", event_date: "2026-08-16" }],
      1,
    );

    expect(label).toBe("🔥 오늘 부천 오픈매트");
  });

  it("shows tomorrow highlight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T10:00:00"));

    const label = getGymEventHighlight(
      [{ id: "1", title: "기술 세미나", event_date: "2026-08-17" }],
      1,
    );

    expect(label).toBe("📅 내일 기술 세미나");
  });

  it("shows weekly count for later events", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T10:00:00"));

    const label = getGymEventHighlight(
      [{ id: "1", title: "오픈매트", event_date: "2026-08-20" }],
      2,
    );

    expect(label).toBe("📅 이번주 이벤트 2개");
  });
});
