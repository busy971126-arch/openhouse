import { describe, expect, it } from "vitest";
import {
  buildApplyExperience,
  formatApplyBackground,
  formatParticipantExperienceSummary,
  getApplicantBackgroundOptions,
  getApplyFormDefaultsFromProfile,
  isAthleteBackgroundProfile,
  parseApplyExperience,
} from "./experience-apply";

describe("parseApplyExperience", () => {
  it("maps elite athlete to 선수 출신", () => {
    expect(parseApplyExperience("엘리트 선수")).toEqual({
      background: "선수 출신",
      years: "",
    });
  });

  it("parses general trainee with years", () => {
    expect(parseApplyExperience("일반 수련자 · 3~5년")).toEqual({
      background: "일반 수련자",
      years: "3~5년",
    });
  });

  it("maps legacy 1년 미만 to 입문", () => {
    expect(parseApplyExperience("일반 수련자 · 1년 미만")).toEqual({
      background: "일반 수련자",
      years: "입문",
    });
  });
});

describe("buildApplyExperience", () => {
  it("builds general trainee string", () => {
    expect(buildApplyExperience("일반 수련자", "1~3년")).toBe(
      "일반 수련자 · 1~3년",
    );
  });

  it("returns background only for athlete", () => {
    expect(buildApplyExperience("선수 출신", "")).toBe("선수 출신");
  });
});

describe("formatApplyBackground", () => {
  it("returns 선수 출신 for elite legacy value", () => {
    expect(formatApplyBackground("엘리트 선수")).toBe("선수 출신");
  });
});

describe("isAthleteBackgroundProfile", () => {
  it("returns true for elite and athlete profiles", () => {
    expect(isAthleteBackgroundProfile("엘리트 선수")).toBe(true);
    expect(isAthleteBackgroundProfile("선수 출신")).toBe(true);
    expect(isAthleteBackgroundProfile("엘리트 선수 출신")).toBe(true);
  });

  it("returns false for general trainee", () => {
    expect(isAthleteBackgroundProfile("일반 수련자 · 3~5년")).toBe(false);
  });
});

describe("formatParticipantExperienceSummary", () => {
  it("combines general trainee background and years", () => {
    expect(formatParticipantExperienceSummary("일반 수련자 · 3~5년")).toBe(
      "일반 · 3~5년",
    );
  });

  it("returns athlete background without years", () => {
    expect(formatParticipantExperienceSummary("선수 출신")).toBe("선수 출신");
    expect(formatParticipantExperienceSummary("엘리트 선수")).toBe("선수 출신");
  });

  it("returns 지도자 for gym operators", () => {
    expect(formatParticipantExperienceSummary("일반 수련자 · 3~5년", true)).toBe(
      "지도자",
    );
  });
});

describe("getApplyFormDefaultsFromProfile", () => {
  it("prefills apply fields from profile", () => {
    expect(
      getApplyFormDefaultsFromProfile({
        weightClass: "-81kg",
        experience: "일반 수련자 · 3~5년",
        gymAffiliation: "OO 유도장",
      }),
    ).toEqual({
      weightClass: "-81kg",
      background: "일반 수련자",
      years: "3~5년",
      gymAffiliation: "OO 유도장",
    });
  });

  it("maps signup year label to apply form", () => {
    expect(
      getApplyFormDefaultsFromProfile({
        experience: "일반 수련자 · 1년 미만",
      }),
    ).toEqual({
      weightClass: "",
      background: "일반 수련자",
      years: "입문",
      gymAffiliation: "",
    });
  });
});

describe("getApplicantBackgroundOptions", () => {
  it("hides general trainee for elite profiles", () => {
    const options = getApplicantBackgroundOptions("엘리트 선수");
    expect(options.map((o) => o.value)).toEqual(["선수 출신", "지도자"]);
  });

  it("shows all options for general profiles", () => {
    const options = getApplicantBackgroundOptions("일반 수련자 · 1~3년");
    expect(options).toHaveLength(3);
  });
});
