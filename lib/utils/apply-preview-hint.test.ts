import { describe, expect, it } from "vitest";
import { buildApplyPreviewHint } from "@/lib/utils/apply-preview-hint";
import type { ParticipantPreview } from "@/lib/utils/participant-preview";

const fullPreview: ParticipantPreview = {
  total: 8,
  hidden: false,
  weight_classes: { "-73kg": 3, "-81kg": 5 },
  backgrounds: { "일반 수련자": 6, "엘리트 선수 출신": 2 },
  experience_years: { "3~5년": 4, "1~3년": 2 },
  sparring_seekers: [
    {
      nickname: "주짓수판다43",
      weight_class: "-73kg",
      experience: "일반 수련자 · 3~5년",
      sparring_intensity: null,
    },
  ],
};

describe("buildApplyPreviewHint", () => {
  it("guides when there are no participants yet", () => {
    const hint = buildApplyPreviewHint(null, "-73kg", "일반 수련자 · 3~5년");
    expect(hint.title).toContain("참가자가 모이면");
  });

  it("guides when preview is hidden", () => {
    const hint = buildApplyPreviewHint(
      { ...fullPreview, total: 2, hidden: true },
      "-73kg",
      "일반 수련자 · 3~5년",
    );
    expect(hint.title).toContain("참가 예정 2명");
    expect(hint.title).toContain("3명 이상");
  });

  it("highlights similar participants", () => {
    const hint = buildApplyPreviewHint(
      fullPreview,
      "-73kg",
      "일반 수련자 · 3~5년",
    );

    expect(hint.title).toContain("비슷한 체급(-73kg) 3명");
    expect(hint.title).toContain("일반 수련자 6명");
    expect(hint.title).toContain("비슷한 경력(3~5년) 4명");
    expect(hint.title).toContain("대련 찾는 사람 1명");
  });
});
