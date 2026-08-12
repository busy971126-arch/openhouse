import Link from "next/link";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { HomeUpcomingEvents } from "@/components/home/HomeUpcomingEvents";

export function HomeUpcomingEventsSection() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeUpcomingEvents />
    </Suspense>
  );
}
