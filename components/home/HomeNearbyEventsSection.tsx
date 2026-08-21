import Link from "next/link";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { HomeEventCompactRow } from "@/components/home/HomeEventCompactRow";
import { HomeNearbyLocationAction } from "@/components/home/HomeNearbyLocationAction";
import { createClient } from "@/lib/supabase/server";
import { getHomeNearbyEvents } from "@/lib/queries/home-events";
import { Alert } from "@/components/Alert";

export function HomeNearbyEventsSection() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeNearbyEvents />
    </Suspense>
  );
}

async function HomeNearbyEvents() {
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

    profileRegions = (profile?.regions ?? []).filter(
      (region: string) => region !== "전국",
    );
  }

  const { items, regions, error } = await getHomeNearbyEvents(profileRegions, 3);
  const regionSummary = regions.slice(0, 2).join(", ");

  return (
    <section className="border-t border-zinc-200 pt-5">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">NEAR YOU</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h2 className="text-lg font-bold tracking-[-0.02em] text-zinc-950">내 주변</h2>
            {regionSummary && <span className="text-xs text-zinc-500">{regionSummary}</span>}
          </div>
        </div>
        {items.length > 0 && (
          <Link
            href="/events?quick=nearby"
            className="text-xs font-semibold text-zinc-600 hover:text-orange-600"
          >
            전체 보기 →
          </Link>
        )}
      </div>

      {error ? (
        <div className="mt-3">
          <Alert message="이벤트를 불러오지 못했습니다." />
        </div>
      ) : items.length > 0 ? (
        <div className="mt-3 divide-y divide-zinc-200 border-y border-zinc-200">
          {items.map((item) => (
            <HomeEventCompactRow
              key={item.event.id}
              item={item}
              meta={`${item.event.region}${item.event.gyms?.name ? ` · ${item.event.gyms.name}` : ""}`}
              badge={item.nearbyLabel}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 border-y border-zinc-200 py-4">
          <HomeNearbyLocationAction />
          <Link
            href={user ? "/my/profile/edit/sports" : "/events?quick=nearby"}
            className="mt-3 inline-block text-xs font-semibold text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-orange-600"
          >
            {user ? "관심 지역 설정" : "지역으로 이벤트 찾기"}
          </Link>
        </div>
      )}
    </section>
  );
}
