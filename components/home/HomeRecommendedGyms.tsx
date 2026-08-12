import Link from "next/link";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { GymListCard } from "@/components/gym/GymListCard";
import { getRecommendedGyms } from "@/lib/queries/gyms";

export function HomeRecommendedGymsSection() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeRecommendedGyms />
    </Suspense>
  );
}

async function HomeRecommendedGyms() {
  const gyms = await getRecommendedGyms(3);

  if (gyms.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-900">추천 체육관</h2>
        <Link
          href="/events?tab=gyms"
          className="text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          전체 보기 →
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {gyms.map((gym) => (
          <GymListCard key={gym.id} gym={gym} />
        ))}
      </div>
    </section>
  );
}
