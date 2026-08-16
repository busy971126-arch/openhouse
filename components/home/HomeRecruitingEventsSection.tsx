import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { HomeRecruitingEventsPanel } from "@/components/home/HomeRecruitingEventsPanel";
import { getHomeRecruitingEvents } from "@/lib/queries/home-events";
import { createClient } from "@/lib/supabase/server";

export function HomeRecruitingEventsSection() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeRecruitingEvents />
    </Suspense>
  );
}

async function HomeRecruitingEvents() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const items = await getHomeRecruitingEvents(12);
  return (
    <HomeRecruitingEventsPanel items={items} isLoggedIn={Boolean(user)} />
  );
}
