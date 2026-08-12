import {
  APPLICANT_BACKGROUND_OPTIONS,
  APPLICANT_YEARS_OPTIONS,
  GYM_OPERATOR_EXPERIENCE,
} from "@/lib/constants/profile";

export type ApplicantBackground = (typeof APPLICANT_BACKGROUND_OPTIONS)[number]["value"];
export type ApplicantYears = (typeof APPLICANT_YEARS_OPTIONS)[number]["value"];

/** 프로필이 선수·엘리트 출신인지 (DB값·표시 문구 모두) */
export function isAthleteBackgroundProfile(
  experience: string | null | undefined,
): boolean {
  if (!experience?.trim()) return false;
  const normalized = experience.trim();
  return (
    normalized === "엘리트 선수" ||
    normalized === "선수 출신" ||
    normalized === "엘리트 선수 출신"
  );
}

/** 참가 신청 폼에 노출할 수련 배경 옵션 */
export function getApplicantBackgroundOptions(
  experience: string | null | undefined,
) {
  if (isAthleteBackgroundProfile(experience)) {
    return APPLICANT_BACKGROUND_OPTIONS.filter(
      (option) => option.value !== "일반 수련자",
    );
  }
  return APPLICANT_BACKGROUND_OPTIONS;
}

export function buildApplyExperience(
  background: ApplicantBackground,
  years: ApplicantYears | "",
): string | null {
  if (background === "일반 수련자") {
    if (!years) return null;
    return `일반 수련자 · ${years}`;
  }
  return background;
}

export function parseApplyExperience(experience: string | null | undefined): {
  background: ApplicantBackground | "";
  years: ApplicantYears | "";
} {
  if (!experience?.trim()) {
    return { background: "", years: "" };
  }

  if (experience === "엘리트 선수" || experience === "선수 출신") {
    return { background: "선수 출신", years: "" };
  }

  if (experience === "지도자") {
    return { background: "지도자", years: "" };
  }

  if (experience.startsWith("일반 수련자 · ")) {
    const raw = experience.replace("일반 수련자 · ", "");
    const years = (raw === "1년 미만" ? "입문" : raw) as ApplicantYears;
    return { background: "일반 수련자", years };
  }

  if (experience.startsWith("일반 수련자")) {
    return { background: "일반 수련자", years: "" };
  }

  return { background: "", years: "" };
}

export function formatApplyExperienceLabel(experience: string | null | undefined) {
  if (!experience?.trim()) return "미입력";
  if (experience === "엘리트 선수") return "선수 출신";
  return experience;
}

export function formatApplyBackground(experience: string | null | undefined) {
  const { background } = parseApplyExperience(experience);
  return background || "미입력";
}

export function formatApplyYears(experience: string | null | undefined) {
  const { background, years } = parseApplyExperience(experience);
  if (background === "일반 수련자") return years || "미입력";
  if (background === "선수 출신" || background === "지도자") return "해당 없음";
  return "미입력";
}

/** 참가자 카드용 — 배경·기간을 한 줄로 (중복 라벨 없이) */
export function formatParticipantExperienceSummary(
  experience: string | null | undefined,
  isGymOperator = false,
): string {
  if (isGymOperator) return GYM_OPERATOR_EXPERIENCE;
  const { background, years } = parseApplyExperience(experience);
  if (!background) return "미입력";
  if (background === "일반 수련자") {
    return years ? `일반 · ${years}` : "일반 수련자";
  }
  return background;
}
