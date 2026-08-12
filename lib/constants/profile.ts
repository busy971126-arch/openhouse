export const GENDER_OPTIONS = [
  { value: "남성", label: "남성" },
  { value: "여성", label: "여성" },
] as const;

export const REGION_OPTIONS = [
  { value: "전국", label: "전국" },
  { value: "서울", label: "서울" },
  { value: "경기", label: "경기" },
  { value: "인천", label: "인천" },
  { value: "부산", label: "부산" },
  { value: "대구", label: "대구" },
  { value: "광주", label: "광주" },
  { value: "대전", label: "대전" },
  { value: "울산", label: "울산" },
  { value: "세종", label: "세종" },
  { value: "강원", label: "강원" },
  { value: "충북", label: "충북" },
  { value: "충남", label: "충남" },
  { value: "전북", label: "전북" },
  { value: "전남", label: "전남" },
  { value: "경북", label: "경북" },
  { value: "경남", label: "경남" },
  { value: "제주", label: "제주" },
] as const;

/** Gym region picker — excludes "전국" */
export const GYM_REGION_OPTIONS = REGION_OPTIONS.filter(
  (option) => option.value !== "전국"
);

export const SPORT_OPTIONS = [
  { value: "유도", label: "유도" },
  { value: "주짓수", label: "주짓수" },
  { value: "레슬링", label: "레슬링" },
  { value: "러닝", label: "러닝" },
  { value: "헬스", label: "헬스" },
  { value: "크로스핏", label: "크로스핏" },
  { value: "축구", label: "축구" },
  { value: "농구", label: "농구" },
  { value: "배드민턴", label: "배드민턴" },
] as const;

export const EXPERIENCE_TYPE_OPTIONS = [
  { value: "일반 수련자", label: "일반 수련자" },
  { value: "엘리트 선수", label: "엘리트 선수" },
] as const;

export const EXPERIENCE_YEARS_OPTIONS = [
  { value: "1년 미만", label: "1년 미만" },
  { value: "1~3년", label: "1~3년" },
  { value: "3~5년", label: "3~5년" },
  { value: "5년 이상", label: "5년+" },
] as const;

/** 참가 신청 폼 — 수련 배경 */
export const APPLICANT_BACKGROUND_OPTIONS = [
  { value: "일반 수련자", label: "일반 수련자" },
  { value: "선수 출신", label: "선수 출신" },
  { value: "지도자", label: "지도자" },
] as const;

/** 참가 신청 폼 — 수련 기간 (일반 수련자) */
export const APPLICANT_YEARS_OPTIONS = [
  { value: "입문", label: "입문" },
  { value: "1~3년", label: "1~3년" },
  { value: "3~5년", label: "3~5년" },
  { value: "5년 이상", label: "5년+" },
] as const;

export const MALE_WEIGHT_CLASS_OPTIONS = [
  { value: "-60kg", label: "-60kg" },
  { value: "-66kg", label: "-66kg" },
  { value: "-73kg", label: "-73kg" },
  { value: "-81kg", label: "-81kg" },
  { value: "-90kg", label: "-90kg" },
  { value: "-100kg", label: "-100kg" },
  { value: "+100kg", label: "+100kg" },
] as const;

/** IJF 유도 여성 체급 */
export const FEMALE_WEIGHT_CLASS_OPTIONS = [
  { value: "-48kg", label: "-48kg" },
  { value: "-52kg", label: "-52kg" },
  { value: "-57kg", label: "-57kg" },
  { value: "-63kg", label: "-63kg" },
  { value: "-70kg", label: "-70kg" },
  { value: "-78kg", label: "-78kg" },
  { value: "+78kg", label: "+78kg" },
] as const;

/** @deprecated 남성 체급과 동일. getWeightClassOptionsForGender 사용 */
export const WEIGHT_CLASS_OPTIONS = MALE_WEIGHT_CLASS_OPTIONS;

export const ALL_WEIGHT_CLASS_OPTIONS = [
  ...MALE_WEIGHT_CLASS_OPTIONS,
  ...FEMALE_WEIGHT_CLASS_OPTIONS,
] as const;

export type WeightClassOption = { value: string; label: string };

export function getWeightClassOptionsForGender(
  gender: string | null | undefined,
): WeightClassOption[] {
  if (gender === "여성") {
    return [...FEMALE_WEIGHT_CLASS_OPTIONS];
  }
  if (gender === "남성") {
    return [...MALE_WEIGHT_CLASS_OPTIONS];
  }
  return [];
}

export function isWeightClassValidForGender(
  weightClass: string | null | undefined,
  gender: string | null | undefined,
): boolean {
  const trimmed = weightClass?.trim();
  if (!trimmed) return true;
  return getWeightClassOptionsForGender(gender).some(
    (option) => option.value === trimmed,
  );
}

export const SPARRING_INTENSITY_OPTIONS = [
  { value: "light", label: "가볍게" },
  { value: "moderate", label: "보통" },
  { value: "hard", label: "강하게" },
] as const;

/** 체육관 운영자(관장·사범) 프로필 수련 배경 */
export const GYM_OPERATOR_EXPERIENCE = "지도자";

export type SparringIntensity = (typeof SPARRING_INTENSITY_OPTIONS)[number]["value"];

export function buildExperience(
  type: string,
  years: string,
): string | null {
  if (type === "엘리트 선수") return "엘리트 선수";
  if (type === "일반 수련자" && years) return `일반 수련자 · ${years}`;
  return null;
}

export function formatProfileField(value: string | null | undefined) {
  return value?.trim() || "미입력";
}

export function formatProfileList(values: string[] | null | undefined) {
  if (!values?.length) return "미입력";
  return values.join(", ");
}

/** 프로필 카드용 지역 표시 (서울 · 경기) */
export function formatProfileRegions(values: string[] | null | undefined) {
  if (!values?.length) return null;
  const filtered = values.filter((v) => v !== "전국");
  if (filtered.length === 0) return "전국";
  return filtered.join(" · ");
}

/** 대련 찾기 UI용 — 일반 / 엘리트 구분 */
export function formatSparringBackground(
  experience: string | null | undefined,
): string | null {
  if (!experience?.trim()) return null;
  if (experience === "엘리트 선수" || experience === "선수 출신") {
    return "선수 출신";
  }
  if (experience === "지도자") return "지도자";
  if (experience.startsWith("일반 수련자")) return "일반 수련자";
  return null;
}

/** 대련 찾기 UI용 — 수련 배경 + 기간 */
export function formatSparringExperienceDetails(
  experience: string | null | undefined,
): { background: string; years: string | null } | null {
  if (!experience?.trim()) return null;

  if (experience === "엘리트 선수" || experience === "선수 출신") {
    return { background: "선수 출신", years: null };
  }

  if (experience === "지도자") {
    return { background: "지도자", years: null };
  }

  if (experience.startsWith("일반 수련자 · ")) {
    const rawYears = experience.replace("일반 수련자 · ", "");
    const years =
      rawYears === "1년 미만"
        ? "입문"
        : (rawYears as (typeof APPLICANT_YEARS_OPTIONS)[number]["value"]);
    return {
      background: "일반 수련자",
      years,
    };
  }

  if (experience.startsWith("일반 수련자")) {
    return { background: "일반 수련자", years: null };
  }

  return null;
}

/** 수련 배경 배지 문구 */
export function formatExperienceDisplay(experience: string | null | undefined) {
  if (!experience?.trim()) return null;
  if (experience === "엘리트 선수") return "엘리트 선수 출신";
  return experience;
}

/** 프로필 표시용 — 체육관 운영자는 지도자로 표기 */
export function formatProfileExperienceDisplay(
  experience: string | null | undefined,
  isGymOperator = false,
) {
  if (isGymOperator) return GYM_OPERATOR_EXPERIENCE;
  return formatExperienceDisplay(experience);
}

export function resolveProfileExperience(
  experience: string | null | undefined,
  isGymOperator = false,
) {
  if (isGymOperator) return GYM_OPERATOR_EXPERIENCE;
  return experience?.trim() || null;
}

export function getSportEmoji(sport: string) {
  if (sport.includes("유도")) return "🥋";
  if (sport.includes("주짓수")) return "🥋";
  if (sport.includes("복싱")) return "🥊";
  if (sport.includes("러닝")) return "🏃";
  if (sport.includes("클라이밍")) return "🧗";
  return "🏅";
}
