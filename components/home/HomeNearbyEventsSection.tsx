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
    <section className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">📍 내 주변</h2>
          {regionSummary && (
            <p className="mt-0.5 text-xs text-zinc-500">{regionSummary} 기준</p>
          )}
        </div>
        {items.length > 0 && (
          <Link
            href="/events?quick=nearby"
            className="text-xs font-medium text-orange-600 hover:text-orange-700"
          >
            전체 보기 →
          </Link>
        )}
      </div>

      {error ? (
        <div className="px-4 py-3">
          <Alert message="이벤트를 불러오지 못했습니다." />
        </div>
      ) : items.length > 0 ? (
        <div className="divide-y divide-zinc-100 px-4 py-1">
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
        <div className="space-y-3 px-4 py-4">
          <p className="text-sm text-zinc-600">
            {user
              ? "운동 프로필 지역 기준으로 가까운 이벤트를 찾아보세요."
              : "내 위치나 관심 지역 기준으로 이벤트를 찾아보세요."}
          </p>
          <HomeNearbyLocationAction />
          {user ? (
            <Link
              href="/my/profile/edit/sports"
              className="block text-center text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              운동 프로필에 지역 설정 →
            </Link>
          ) : (
            <Link
              href="/events?quick=nearby"
              className="block text-center text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              이벤트 목록에서 찾기 →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
