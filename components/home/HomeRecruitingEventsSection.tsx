import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { HomeRecruitingEventsPanel } from "@/components/home/HomeRecruitingEventsPanel";
import { getHomeRecruitingEvents } from "@/lib/queries/home-events";

export function HomeRecruitingEventsSection() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeRecruitingEvents />
    </Suspense>
  );
}

async function HomeRecruitingEvents() {
  const { items, error } = await getHomeRecruitingEvents(12);
  return <HomeRecruitingEventsPanel items={items} error={error} />;
}
