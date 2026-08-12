import { GymListCard } from "@/components/gym/GymListCard";
import { EmptyState } from "@/components/EmptyState";
import { Alert } from "@/components/Alert";
import type { GymSort } from "@/lib/constants/gym-search";
import {
  attachUpcomingEventCounts,
  getPublicGyms,
  type GymFilters,
} from "@/lib/queries/gyms";
import { sortGyms } from "@/lib/utils/gym-search";

type GymListProps = GymFilters & {
  hasUpcomingEvents?: boolean;
  sort?: GymSort;
  profileRegions?: string[];
};

export async function GymList({
  region,
  sport,
  searchQuery,
  facilities,
  beginnerWelcome,
  nearbyRegions,
  hasUpcomingEvents,
  sort = "recommended",
  profileRegions,
}: GymListProps) {
  const { data, error } = await getPublicGyms({
    region,
    sport,
    searchQuery,
    facilities,
    beginnerWelcome,
    nearbyRegions,
  });

  if (error) {
    return (
      <Alert message="체육관을 불러오지 못했습니다. Supabase 설정을 확인해주세요." />
    );
  }

  if (!data.length) {
    return (
      <EmptyState message="조건에 맞는 체육관이 없습니다. 필터를 바꿔보세요." />
    );
  }

  let gyms = await attachUpcomingEventCounts(data);

  if (hasUpcomingEvents) {
    gyms = gyms.filter((gym) => gym.upcomingEventCount > 0);
  }

  if (gyms.length === 0) {
    return (
      <EmptyState message="조건에 맞는 체육관이 없습니다. 필터를 바꿔보세요." />
    );
  }

  const sorted = sortGyms(gyms, sort, profileRegions);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600">총 {sorted.length}개 체육관</p>
      {sorted.map((gym) => (
        <GymListCard key={gym.id} gym={gym} />
      ))}
    </div>
  );
}
