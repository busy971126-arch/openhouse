import { formatSparringBackground } from "@/lib/constants/profile";
import {
  formatApplyBackground,
  parseApplyExperience,
} from "@/lib/utils/experience-apply";
import type { ParticipantPreview } from "@/lib/utils/participant-preview";

export type ApplyPreviewHint = {
  title: string;
  detail?: string;
};

function getExperienceYearKey(experience: string | null | undefined) {
  const { background, years } = parseApplyExperience(experience);
  if (background !== "일반 수련자" || !years) return null;
  return years;
}

export function buildApplyPreviewHint(
  preview: ParticipantPreview | null,
  weightClass: string | null | undefined,
  experience: string | null | undefined,
): ApplyPreviewHint {
  if (!preview || preview.total === 0) {
    return {
      title: "예정 참가자가 모이면 체급·경력 분포를 미리 볼 수 있어요.",
      detail: "실명·연락처는 공개되지 않습니다.",
    };
  }

  if (preview.hidden) {
    return {
      title: `참가 예정 ${preview.total}명 · 3명 이상이면 구성 미리보기가 열려요.`,
      detail: "신청 전에 비슷한 사람이 있는지 확인해보세요.",
    };
  }

  const matches: string[] = [];
  const wc = weightClass?.trim();

  if (wc && preview.weight_classes[wc]) {
    matches.push(`비슷한 체급(${wc}) ${preview.weight_classes[wc]}명`);
  }

  const backgroundKey =
    formatApplyBackground(experience) !== "미입력"
      ? formatApplyBackground(experience)
      : formatSparringBackground(experience);

  if (backgroundKey && preview.backgrounds[backgroundKey]) {
    matches.push(`${backgroundKey} ${preview.backgrounds[backgroundKey]}명`);
  }

  const yearKey = getExperienceYearKey(experience);
  if (yearKey && preview.experience_years[yearKey]) {
    matches.push(`비슷한 경력(${yearKey}) ${preview.experience_years[yearKey]}명`);
  }

  if (matches.length > 0) {
    return {
      title: matches.join(" · "),
      detail: `참가 예정 ${preview.total}명 · 위에서 전체 구성을 확인하세요.`,
    };
  }

  return {
    title: `참가 예정 ${preview.total}명 · 체급·경력 분포를 미리 확인할 수 있어요.`,
    detail: "이름과 연락처는 공개되지 않습니다.",
  };
}
