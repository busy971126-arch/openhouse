import {
  formatSparringExperienceDetails,
  GYM_OPERATOR_EXPERIENCE,
} from "@/lib/constants/profile";

/** 가입일 표시 — 2026.08 */
export function formatProfileJoinDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}.${month}`;
}

/** 수련 경력 표시 */
export function formatProfileTrainingYears(
  experience: string | null | undefined,
): string | null {
  const details = formatSparringExperienceDetails(experience);
  if (!details?.years) return null;

  if (details.years === "5년 이상") return "5년+";
  if (details.years === "입문") return "1년 미만";
  return details.years;
}

/** 수련 배경 표시 — 호스트는 체육관 직책 우선 */
export function formatProfileTrainingBackground(
  experience: string | null | undefined,
  operatorRoleLabel: string | null,
  isGymOperator: boolean,
): string | null {
  if (isGymOperator && operatorRoleLabel) return operatorRoleLabel;
  if (experience === GYM_OPERATOR_EXPERIENCE) return "지도자";
  if (experience === "엘리트 선수") return "선수 출신";

  const details = formatSparringExperienceDetails(experience);
  if (details?.background) return details.background;

  return experience?.trim() || null;
}
