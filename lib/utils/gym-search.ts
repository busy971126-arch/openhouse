import type { GymWithEventCount } from "@/lib/queries/gyms";
import type { GymSort } from "@/lib/constants/gym-search";

export function regionMatchScore(
  gymRegion: string,
  profileRegions: string[] | undefined,
): number {
  if (!profileRegions?.length) return 0;

  for (const region of profileRegions) {
    if (gymRegion.includes(region) || region.includes(gymRegion)) {
      return 2;
    }
  }

  const gymProvince = gymRegion.split(" ")[0];
  for (const region of profileRegions) {
    if (region.startsWith(gymProvince) || gymProvince.startsWith(region)) {
      return 1;
    }
  }

  return 0;
}

function recommendedScore(gym: GymWithEventCount): number {
  const eventScore = gym.upcomingEventCount * 10;
  const recencyScore =
    new Date(gym.created_at).getTime() / 1_000_000_000_000;
  return eventScore + recencyScore;
}

export function sortGyms(
  gyms: GymWithEventCount[],
  sort: GymSort,
  profileRegions?: string[],
): GymWithEventCount[] {
  const items = [...gyms];

  if (sort === "name") {
    return items.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }

  if (sort === "recent") {
    return items.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  if (sort === "events") {
    return items.sort((a, b) => {
      const countDiff = b.upcomingEventCount - a.upcomingEventCount;
      if (countDiff !== 0) return countDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  if (sort === "distance") {
    return items.sort((a, b) => {
      const scoreDiff =
        regionMatchScore(b.region, profileRegions) -
        regionMatchScore(a.region, profileRegions);
      if (scoreDiff !== 0) return scoreDiff;
      return recommendedScore(b) - recommendedScore(a);
    });
  }

  return items.sort((a, b) => recommendedScore(b) - recommendedScore(a));
}
