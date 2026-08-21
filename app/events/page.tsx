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

    if (regions.length > 0) {
      profileRegions = regions;
    }
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
      <h1 className="text-2xl font-bold">{isGymTab ? "체육관" : "이벤트"}</h1>

      {!user && !isGymTab && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          로그인하면 참가 신청과 내역 관리가 가능합니다.{" "}
          <Link href="/login?redirect=/events" className="font-medium underline">
            로그인
          </Link>
          {" · "}
          <Link href="/signup" className="font-medium underline">
            회원가입
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
            <p className="text-sm text-amber-700">
              프로필에 관심 지역이 없습니다.{" "}
              <Link href="/my/profile/edit/sports" className="font-medium underline">
                운동 프로필
              </Link>
              에서 지역을 설정해주세요.
            </p>
          )}

          {gymSort === "distance" && user && !profileRegions?.length && (
            <p className="text-sm text-amber-700">
              가까운 순 정렬은 프로필 관심 지역을 기준으로 합니다.{" "}
              <Link href="/my/profile/edit/sports" className="font-medium underline">
                운동 프로필
              </Link>
              에서 지역을 설정해주세요.
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
            <p className="text-sm text-amber-700">
              관심 지역이 없습니다.{" "}
              <Link href="/my/profile/edit/sports" className="font-medium underline">
                운동 프로필
              </Link>
              에서 지역을 설정하거나 홈에서 현재 위치로 찾기를 사용해주세요.
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
