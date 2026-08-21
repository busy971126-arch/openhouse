import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { DiscoveryTabToggle } from "./DiscoveryTabToggle";
import { EventFilterBar } from "./EventFilterBar";
import { EventList } from "./EventList";
import { EventSearchBar } from "./EventSearchBar";
import { GymSearchOptions } from "./GymSearchOptions";
import { GymList } from "./GymList";
import { GymSearchBar } from "./GymSearchBar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { GymSort } from "@/lib/constants/gym-search";
import type { EventRecruitmentFilter } from "@/lib/constants/event-recruitment-filter";
import type { EventType } from "@/lib/types/database";
import {
  getQuickFilterDateRange,
  type EventQuickFilter,
} from "@/lib/utils/event-quick-filters";

type PageProps = {
  searchParams: Promise<{
    tab?: string;
    region?: string;
    sport?: string;
    date?: string;
    type?: string;
    past?: string;
    quick?: string;
    q?: string;
    status?: string;
    facilities?: string;
    beginner?: string;
    hasEvents?: string;
    sort?: string;
  }>;
};

const GYM_SORT_VALUES = new Set<GymSort>([
  "recommended",
  "distance",
  "events",
  "recent",
  "name",
]);

export default async function EventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const isGymTab = params.tab === "gyms";
  const eventType = params.type as EventType | undefined;
  const quick = params.quick as EventQuickFilter | undefined;
  const recruitmentStatus =
    (params.status as EventRecruitmentFilter | undefined) ?? "recruiting";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileRegions: string[] | undefined;
  let nearbyRegions: string[] | undefined;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("regions")
      .eq("id", user.id)
      .maybeSingle();

    const regions = (profile?.regions ?? []).filter(
      (region: string) => region !== "전국",
    );

    if (regions.length > 0) profileRegions = regions;
  }

  if (
    params.region?.trim() &&
    ((isGymTab && params.quick === "nearby") || (!isGymTab && quick === "nearby"))
  ) {
    nearbyRegions = [params.region.trim()];
  } else if (profileRegions?.length) {
    if (
      (isGymTab && params.quick === "nearby") ||
      (!isGymTab && quick === "nearby")
    ) {
      nearbyRegions = profileRegions;
    }
  }

  const gymSort: GymSort =
    params.sort && GYM_SORT_VALUES.has(params.sort as GymSort)
      ? (params.sort as GymSort)
      : "recommended";

  const gymFacilities = params.facilities
    ? params.facilities.split(",").filter(Boolean)
    : undefined;

  const quickRange = getQuickFilterDateRange(quick);
  const date = params.date ?? quickRange?.single;
  const dateFrom = quickRange?.start;
  const dateTo = quickRange?.end;

  return (
    <div className="flex flex-col gap-5">
      <header className="pt-1">
        <p className="text-[10px] font-black tracking-[0.18em] text-orange-600">DISCOVER</p>
        <h1 className="mt-1 text-[28px] font-black tracking-[-0.03em] text-zinc-950">
          {isGymTab ? "운동할 곳을 찾자" : "다음 운동을 찾자"}
        </h1>
      </header>

      {!user && !isGymTab && (
        <div className="border-l-2 border-orange-600 py-1 pl-3 text-xs leading-5 text-zinc-600">
          참가 신청은 로그인 후 가능합니다.{" "}
          <Link href="/login?redirect=/events" className="font-bold text-zinc-950 underline underline-offset-4">
            로그인
          </Link>
        </div>
      )}

      <Suspense fallback={<LoadingSpinner />}>
        <DiscoveryTabToggle />
      </Suspense>

      {isGymTab ? (
        <>
          <Suspense fallback={<LoadingSpinner />}>
            <GymSearchBar />
          </Suspense>

          <Suspense fallback={<LoadingSpinner />}>
            <GymSearchOptions />
          </Suspense>

          {params.quick === "nearby" && user && !nearbyRegions?.length && (
            <p className="border-l-2 border-amber-500 pl-3 text-sm text-amber-800">
              관심 지역이 없습니다. <Link href="/my/profile/edit/sports" className="font-bold underline">운동 프로필에서 설정</Link>
            </p>
          )}

          {gymSort === "distance" && user && !profileRegions?.length && (
            <p className="border-l-2 border-amber-500 pl-3 text-sm text-amber-800">
              가까운 순은 관심 지역을 기준으로 합니다. <Link href="/my/profile/edit/sports" className="font-bold underline">지역 설정</Link>
            </p>
          )}

          <Suspense fallback={<LoadingSpinner />}>
            <GymList
              region={params.region}
              sport={params.sport}
              searchQuery={params.q}
              facilities={gymFacilities}
              beginnerWelcome={params.beginner === "1"}
              nearbyRegions={nearbyRegions}
              hasUpcomingEvents={params.hasEvents === "1"}
              sort={gymSort}
              profileRegions={profileRegions}
            />
          </Suspense>
        </>
      ) : (
        <>
          <Suspense fallback={<LoadingSpinner />}>
            <EventSearchBar />
          </Suspense>

          <Suspense fallback={<LoadingSpinner />}>
            <EventFilterBar />
          </Suspense>

          {quick === "nearby" && !nearbyRegions?.length && (
            <p className="border-l-2 border-amber-500 pl-3 text-sm text-amber-800">
              관심 지역이 없습니다. <Link href="/my/profile/edit/sports" className="font-bold underline">지역 설정</Link>
              {" 또는 홈에서 현재 위치를 사용하세요."}
            </p>
          )}

          <Suspense fallback={<LoadingSpinner />}>
            <EventList
              region={params.region}
              sport={params.sport}
              date={date}
              dateFrom={dateFrom}
              dateTo={dateTo}
              eventType={eventType}
              includePast={params.past === "1"}
              nearbyRegions={nearbyRegions}
              searchQuery={params.q}
              recruitmentStatus={recruitmentStatus}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
