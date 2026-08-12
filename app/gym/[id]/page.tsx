import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventGymSection } from "@/components/events/EventGymSection";
import { EmptyState } from "@/components/EmptyState";
import {
  getPublicGymById,
  getUpcomingEventsForGym,
} from "@/lib/queries/gyms";
import { isGymFollowed } from "@/lib/queries/participant-preview";
import { getApprovedCountsByEvent } from "@/lib/queries/event-counts";
import { formatEventDetailDate } from "@/lib/utils/date";
import { formatEventFeeDisplay } from "@/lib/utils/event-display";
import { formatEventType } from "@/lib/constants/event-types";
import type { Gym } from "@/lib/types/database";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function GymDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: gym, error } = await getPublicGymById(id);
  if (error || !gym) notFound();

  const loginRedirect = `/gym/${id}`;

  const [{ data: upcomingEvents }, { followed: isFollowed }] = await Promise.all([
    getUpcomingEventsForGym(id),
    user
      ? isGymFollowed(user.id, id)
      : Promise.resolve({ followed: false }),
  ]);

  const countsMap = await getApprovedCountsByEvent(
    (upcomingEvents ?? []).map((event) => event.id),
  );

  const gymForSection = gym as Pick<
    Gym,
    | "id"
    | "name"
    | "sport"
    | "region"
    | "address"
    | "photo_url"
    | "phone"
    | "instagram_url"
    | "homepage_url"
    | "description"
    | "facilities"
    | "facility_notes"
    | "class_schedule"
    | "operating_hours"
    | "closed_days"
    | "preparation_guide"
    | "mat_photos"
    | "facility_photos"
    | "exterior_photos"
    | "parking_photos"
  >;

  const isOwner = user?.id === gym.owner_id;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/events?tab=gyms"
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        ← 체육관 목록
      </Link>

      <EventGymSection
        gym={gymForSection}
        userId={user?.id ?? null}
        isFollowed={isFollowed}
        loginRedirect={loginRedirect}
        variant="gym"
        defaultExpanded
      />

      {isOwner && (
        <Link
          href={`/gym/${id}/edit`}
          className="block rounded-xl border border-zinc-300 py-3 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          체육관 정보 수정
        </Link>
      )}

      <section
        id="gym-upcoming-events"
        className="scroll-mt-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <h2 className="font-semibold text-zinc-900">예정 이벤트</h2>

        {!upcomingEvents?.length ? (
          <div className="mt-3">
            <EmptyState message="예정된 이벤트가 없습니다." />
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {upcomingEvents.map((event) => {
              const approved = countsMap.get(event.id) ?? 0;
              const participantLine =
                event.max_participants != null && event.max_participants > 0
                  ? `${approved}/${event.max_participants}명`
                  : `${approved}명`;

              return (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}`}
                    className="block rounded-lg border border-zinc-200 px-4 py-3 hover:bg-zinc-50"
                  >
                    <p className="text-xs text-zinc-500">
                      {event.sport} · {formatEventType(event.event_type)}
                    </p>
                    <p className="mt-1 font-semibold text-zinc-900">
                      {event.title}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {formatEventDetailDate(event.event_date)}
                      {event.region ? ` · ${event.region}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      👥 {participantLine} · 💰{" "}
                      {formatEventFeeDisplay(event.fee_amount)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
