import { SPARRING_INTENSITY_OPTIONS } from "@/lib/constants/profile";

export type SparringSeeker = {
  user_id: string;
  nickname: string;
  weight_class: string;
  experience: string;
  sparring_intensity: string | null;
};

export type PreviewParticipant = {
  user_id: string;
  nickname: string;
  gender: string;
  weight_class: string;
  experience: string;
};

export type ParticipantPreview = {
  total: number;
  hidden: boolean;
  genders: Record<string, number>;
  participants: PreviewParticipant[];
  weight_classes: Record<string, number>;
  backgrounds: Record<string, number>;
  experience_years: Record<string, number>;
  sparring_seekers: SparringSeeker[];
};

export function parseParticipantPreview(raw: unknown): ParticipantPreview | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;
  const total = typeof data.total === "number" ? data.total : 0;
  const hidden = Boolean(data.hidden);

  return {
    total,
    hidden,
    genders: parseCountMap(data.genders),
    participants: parsePreviewParticipants(data.participants),
    weight_classes: parseCountMap(data.weight_classes),
    backgrounds: parseCountMap(data.backgrounds),
    experience_years: parseCountMap(data.experience_years),
    sparring_seekers: parseSparringSeekers(data.sparring_seekers),
  };
}

function parsePreviewParticipants(value: unknown): PreviewParticipant[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      user_id: String(item.user_id ?? ""),
      nickname: String(item.nickname ?? "익명"),
      gender: String(item.gender ?? "미입력"),
      weight_class: String(item.weight_class ?? "미입력"),
      experience: String(item.experience ?? "미입력"),
    }))
    .filter((item) => item.user_id.length > 0);
}

export function normalizeWeightClassForFilter(
  weightClass: string | null | undefined,
): string | null {
  const trimmed = weightClass?.trim();
  if (!trimmed || trimmed === "미입력") return null;
  return trimmed;
}

export function resolveViewerWeightClass(
  registrationApplyWeightClass: string | null | undefined,
  profileWeightClass: string | null | undefined,
): string | null {
  return (
    normalizeWeightClassForFilter(registrationApplyWeightClass) ??
    normalizeWeightClassForFilter(profileWeightClass)
  );
}

export function participantMatchesViewerWeightClass(
  participant: Pick<PreviewParticipant, "weight_class">,
  viewerWeightClass: string | null,
): boolean {
  if (!viewerWeightClass) return true;
  return (
    normalizeWeightClassForFilter(participant.weight_class) === viewerWeightClass
  );
}

export function filterParticipantsByViewerWeightClass(
  participants: PreviewParticipant[],
  viewerWeightClass: string | null,
): PreviewParticipant[] {
  if (!viewerWeightClass) return participants;
  return participants.filter((participant) =>
    participantMatchesViewerWeightClass(participant, viewerWeightClass),
  );
}

export function computeGenderCountsFromParticipants(
  participants: PreviewParticipant[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const participant of participants) {
    const gender = participant.gender || "미입력";
    counts[gender] = (counts[gender] ?? 0) + 1;
  }
  return counts;
}

export function formatGenderSummary(genders: Record<string, number>): string | null {
  const male = genders["남성"] ?? 0;
  const female = genders["여성"] ?? 0;

  if (male === 0 && female === 0) return null;

  const parts: string[] = [];
  if (male > 0) parts.push(`남 ${male}명`);
  if (female > 0) parts.push(`여 ${female}명`);
  return parts.join(" / ");
}

export function formatPreviewParticipantGender(gender: string): string | null {
  if (gender === "남성") return "남";
  if (gender === "여성") return "여";
  return null;
}

function parseCountMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, count]) => [key, Number(count)] as const)
      .filter(([, count]) => Number.isFinite(count) && count > 0),
  );
}

function parseSparringSeekers(value: unknown): SparringSeeker[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      user_id: String(item.user_id ?? ""),
      nickname: String(item.nickname ?? "익명"),
      weight_class: String(item.weight_class ?? "미입력"),
      experience: String(item.experience ?? "미입력"),
      sparring_intensity:
        item.sparring_intensity == null
          ? null
          : String(item.sparring_intensity),
    }))
    .filter((item) => item.user_id.length > 0);
}

export function formatSparringIntensity(intensity: string | null): string {
  if (!intensity) return "강도 미정";
  return (
    SPARRING_INTENSITY_OPTIONS.find((option) => option.value === intensity)
      ?.label ?? intensity
  );
}

export function sortCountEntries(map: Record<string, number>): [string, number][] {
  return Object.entries(map).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0], "ko");
  });
}

export function formatExperienceShort(experience: string): string {
  if (experience === "엘리트 선수") return "엘리트 선수 출신";
  if (experience.startsWith("일반 수련자 · ")) {
    return `수련 ${experience.replace("일반 수련자 · ", "")}`;
  }
  return experience;
}
