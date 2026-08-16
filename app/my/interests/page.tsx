import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { MyInterestsTabs } from "@/components/my/MyInterestsTabs";
import {
  enrichEventInterestsWithStatus,
  getUserEventInterests,
} from "@/lib/queries/event-interests";
import { getUserGymFollows } from "@/lib/queries/participant-preview";
import { attachUpcomingEventCounts } from "@/lib/queries/gyms";
import type { GymWithEventCount } from "@/lib/queries/gyms";
import type { EventRecruitmentStatus } from "@/lib/utils/event-status";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function MyInterestsPage(_props: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/my/interests");

  const [{ data: gymFollows }, { data: eventInterests }] = await Promise.all([
    getUserGymFollows(user.id),
    getUserEventInterests(user.id),
  ]);

  const gymRows = (gymFollows ?? [])
    .map((row) => {
      const gymRaw = row.gyms;
      const gym =
        gymRaw && typeof gymRaw === "object" && !Array.isArray(gymRaw)
          ? gymRaw
          : Array.isArray(gymRaw)
            ? gymRaw[0]
            : null;

      if (!gym || typeof gym !== "object") return null;

      return gym as GymWithEventCount;
    })
    .filter((gym): gym is GymWithEventCount => gym != null);

  const gymsWithCounts = await attachUpcomingEventCounts(gymRows);

  const enrichedEvents = await enrichEventInterestsWithStatus(eventInterests ?? []);
  const eventItems = enrichedEvents
    .filter((item) => item.event && item.recruitmentStatus)
    .map((item) => ({
      event_id: item.event_id,
      event: item.event!,
      recruitmentStatus: item.recruitmentStatus as EventRecruitmentStatus,
    }));

  return (
    <div className="flex flex-col gap-6">
      <Link href="/my" className="text-sm font-medium text-orange-600">
        ← 마이페이지
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900">관심</h1>
      <p className="text-sm text-zinc-600">
        관심 이벤트 상태는 조회 시점 기준으로 계산됩니다.
      </p>

      <Suspense fallback={<div className="text-sm text-zinc-500">불러오는 중...</div>}>
        <MyInterestsTabs
          userId={user.id}
          gymItems={gymsWithCounts}
          eventItems={eventItems}
        />
      </Suspense>
    </div>
  );
}
