import { describe, expect, it } from "vitest";
import {
  computeGenderCountsFromParticipants,
  filterParticipantsByViewerWeightClass,
  formatExperienceShort,
  formatGenderSummary,
  formatSparringIntensity,
  normalizeWeightClassForFilter,
  parseParticipantPreview,
  participantMatchesViewerWeightClass,
  resolveViewerWeightClass,
  sortCountEntries,
} from "@/lib/utils/participant-preview";

describe("participant-preview", () => {
  it("parses preview payload", () => {
    const preview = parseParticipantPreview({
      total: 8,
      hidden: false,
      genders: { 남성: 5, 여성: 3 },
      participants: [
        {
          user_id: "user-1",
          nickname: "주짓수판다43",
          gender: "남성",
          weight_class: "-73kg",
          experience: "일반 수련자 · 3~5년",
        },
      ],
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
    expect(preview?.genders["남성"]).toBe(5);
    expect(preview?.participants).toHaveLength(1);
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

  it("formats gender summary", () => {
    expect(formatGenderSummary({ 남성: 3, 여성: 2 })).toBe("남 3명 / 여 2명");
    expect(formatGenderSummary({ 남성: 0, 여성: 0, 미입력: 2 })).toBeNull();
  });

  it("resolves viewer weight class from registration then profile", () => {
    expect(
      resolveViewerWeightClass("-73kg", "-81kg"),
    ).toBe("-73kg");
    expect(resolveViewerWeightClass(null, "-81kg")).toBe("-81kg");
    expect(resolveViewerWeightClass("  ", "미입력")).toBeNull();
  });

  it("filters participants by viewer weight class", () => {
    const participants = [
      {
        user_id: "1",
        nickname: "A",
        gender: "남성",
        weight_class: "-73kg",
        experience: "미입력",
      },
      {
        user_id: "2",
        nickname: "B",
        gender: "여성",
        weight_class: "-81kg",
        experience: "미입력",
      },
    ];

    expect(
      filterParticipantsByViewerWeightClass(participants, "-73kg"),
    ).toHaveLength(1);
    expect(
      participantMatchesViewerWeightClass(participants[0], "-73kg"),
    ).toBe(true);
    expect(normalizeWeightClassForFilter(" 미입력 ")).toBeNull();
    expect(
      formatGenderSummary(
        computeGenderCountsFromParticipants(
          filterParticipantsByViewerWeightClass(participants, "-73kg"),
        ),
      ),
    ).toBe("남 1명");
  });
});
