import { regionMatchScore } from "@/lib/utils/gym-search";

type GymRecommendInput = {
  region: string;
  sport: string;
  upcomingEventCount: number;
};

export function formatGymRecommendReason(
  gym: GymRecommendInput,
  profileRegions: string[] = [],
): string {
  const regions = profileRegions.filter((region) => region !== "전국");
  const score = regions.length > 0 ? regionMatchScore(gym.region, regions) : 0;

  if (score >= 1 && gym.upcomingEventCount > 0) {
    return `내 지역 · 예정 이벤트 ${gym.upcomingEventCount}개`;
  }

  if (score >= 1) {
    return `내 활동 지역 · ${gym.sport}`;
  }

  if (gym.upcomingEventCount > 0) {
    return `예정 이벤트 ${gym.upcomingEventCount}개 · ${gym.region}`;
  }

  return `${gym.region} · ${gym.sport}`;
}
