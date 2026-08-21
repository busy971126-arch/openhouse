import Link from "next/link";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { InterestHeart } from "@/components/interest/InterestHeart";
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

  const gyms = await getRecommendedGyms(6);
  const interestedGymIds = await getUserInterestedGymIds(user?.id);

  if (gyms.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-zinc-200 pt-5">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">GYMS TO WATCH</p>
          <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-zinc-950">추천 체육관</h2>
        </div>
        <Link
          href="/events?tab=gyms"
          className="shrink-0 text-xs font-semibold text-zinc-600 hover:text-orange-600"
        >
          전체 보기 →
        </Link>
      </div>

      <div className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {gyms.map((gym) => {
          const gymHref = `/gym/${gym.id}`;
          const sport = gym.sport ?? "유도";
          const imageUrl = gym.photo_url?.trim() || null;
          const recommendReason = formatGymRecommendReason(gym, profileRegions);

          return (
            <article
              key={gym.id}
              className="w-[74%] min-w-[250px] max-w-[310px] shrink-0 snap-start overflow-hidden border border-zinc-200 bg-white transition hover:border-zinc-400"
            >
              <div className="relative">
                <Link href={gymHref} className="block">
                  <div className="aspect-[4/3] overflow-hidden bg-zinc-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`${gym.name} 대표사진`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-zinc-950 text-sm font-black tracking-[0.2em] text-white">
                        OHS
                      </div>
                    )}
                  </div>
                </Link>

                <div className="absolute left-2.5 top-2.5 bg-black/65 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                  {sport}
                </div>

                <div className="absolute right-2 top-2 rounded-full bg-white/95 shadow-sm backdrop-blur-sm">
                  <InterestHeart
                    kind="gym"
                    targetId={gym.id}
                    initialInterested={interestedGymIds.has(gym.id)}
                    userId={user?.id ?? null}
                    loginRedirect={gymHref}
                    size="xs"
                  />
                </div>
              </div>

              <Link href={gymHref} className="block px-3.5 py-3.5">
                <h3 className="truncate text-base font-bold text-zinc-950">{gym.name}</h3>
                <p className="mt-1 truncate text-sm text-zinc-600">
                  {gym.region || gym.address || "지역 정보 없음"}
                </p>
                <p className="mt-2 truncate text-xs font-medium text-zinc-500">
                  {recommendReason}
                </p>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
