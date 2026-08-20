import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { HostParticipantsManager } from "@/components/host/HostParticipantsManager";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  getHostEventsForGym,
  getHostGyms,
  getHostParticipantsForEvent,
} from "@/lib/queries/host-participants";

type PageProps = {
  searchParams: Promise<{
    gym?: string;
    event?: string;
  }>;
};

export default async function HostParticipantsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/host/participants");

  const gyms = await getHostGyms(user.id);

  if (gyms.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">참가자 관리</h1>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
          <p className="text-sm text-zinc-600">
            체육관을 등록하면 참가자 관리를 사용할 수 있습니다.
          </p>
          <Link
            href="/gym/new"
            className="mt-4 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            체육관 등록하기
          </Link>
        </div>
      </div>
    );
  }

  const selectedGymId =
    params.gym && gyms.some((gym) => gym.id === params.gym)
      ? params.gym
      : gyms[0].id;

  const { events, error: eventsError } = await getHostEventsForGym(selectedGymId);

  const selectedEventId =
    params.event && events.some((event) => event.id === params.event)
      ? params.event
      : events[0]?.id ?? null;

  if (!params.gym) {
    const urlParams = new URLSearchParams({ gym: selectedGymId });
    if (selectedEventId) urlParams.set("event", selectedEventId);
    redirect(`/host/participants?${urlParams.toString()}`);
  }

  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? null;

  const participantsResult = selectedEventId
    ? await getHostParticipantsForEvent(selectedEventId)
    : { registrations: [], error: false };

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HostParticipantsManager
        gyms={gyms}
        events={events}
        eventsError={eventsError}
        registrations={participantsResult.registrations}
        registrationsError={participantsResult.error}
        selectedGymId={selectedGymId}
        selectedEventId={selectedEventId}
        selectedEvent={selectedEvent}
      />
    </Suspense>
  );
}
