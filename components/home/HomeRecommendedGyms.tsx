import Link from "next/link";
import { Suspense } from "react";
import { LoginRequiredPromptButton } from "@/components/auth/LoginRequiredPromptButton";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { GymListCard } from "@/components/gym/GymListCard";
import { getRecommendedGyms } from "@/lib/queries/gyms";
import { getUserInterestedGymIds } from "@/lib/queries/interests";
import { createClient } from "@/lib/supabase/server";
import { formatGymRecommendReason } from "@/lib/utils/gym-recommend-reason";

export function HomeRecommendedGymsSection() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeRecommendedGyms />
    </Suspense>
  );
}

async function HomeRecommendedGyms() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileRegions: string[] = [];
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("regions")
      .eq("id", user.id)
      .maybeSingle();
    profileRegions = profile?.regions ?? [];
  }

  const gyms = await getRecommendedGyms(3);
  const interestedGymIds = await getUserInterestedGymIds(user?.id);
  const isLoggedIn = Boolean(user);
  const visibleGyms = isLoggedIn ? gyms : gyms.slice(0, 1);

  if (visibleGyms.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-900">추천 체육관</h2>
        {isLoggedIn ? (
          <Link
            href="/events?tab=gyms"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            전체 보기 →
          </Link>
        ) : (
          <LoginRequiredPromptButton
            loginRedirect="/events?tab=gyms"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          />
        )}
      </div>
      <div className="flex flex-col gap-3">
        {visibleGyms.map((gym) => (
          <GymListCard
            key={gym.id}
            gym={gym}
            recommendReason={formatGymRecommendReason(gym, profileRegions)}
            userId={user?.id ?? null}
            initialInterested={interestedGymIds.has(gym.id)}
          />
        ))}
      </div>
    </section>
  );
}
