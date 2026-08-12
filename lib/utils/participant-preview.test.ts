import { describe, expect, it } from "vitest";
import {
  formatExperienceShort,
  formatSparringIntensity,
  parseParticipantPreview,
  sortCountEntries,
} from "@/lib/utils/participant-preview";

describe("participant-preview", () => {
  it("parses preview payload", () => {
    const preview = parseParticipantPreview({
      total: 8,
      hidden: false,
      weight_classes: { "-73kg": 3, "-81kg": 5 },
      backgrounds: { "일반 수련자": 6, "엘리트 선수 출신": 2 },
      experience_years: { "3~5년": 4 },
      sparring_seekers: [
        {
          user_id: "user-1",
          nickname: "주짓수판다43",
          weight_class: "-73kg",
          experience: "일반 수련자 · 3~5년",
          sparring_intensity: "moderate",
        },
      ],
    });

    expect(preview?.total).toBe(8);
    expect(preview?.weight_classes["-73kg"]).toBe(3);
    expect(preview?.sparring_seekers).toHaveLength(1);
    expect(preview?.sparring_seekers[0]?.user_id).toBe("user-1");
  });

  it("marks hidden preview when total is low", () => {
    const preview = parseParticipantPreview({ total: 2, hidden: true });
    expect(preview?.hidden).toBe(true);
  });

  it("formats experience and intensity labels", () => {
    expect(formatExperienceShort("일반 수련자 · 3~5년")).toBe("수련 3~5년");
    expect(formatSparringIntensity("hard")).toBe("강하게");
  });

  it("sorts count entries by count desc", () => {
    const sorted = sortCountEntries({ "-81kg": 2, "-73kg": 5 });
    expect(sorted[0]).toEqual(["-73kg", 5]);
  });
});
