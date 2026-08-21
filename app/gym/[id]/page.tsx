import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventGymSection } from "@/components/events/EventGymSection";
import { AppIcon } from "@/components/ui/AppIcon";
import {
  getPublicGymById,
  getUpcomingEventsForGym,
} from "@/lib/queries/gyms";
import { isGymFollowed } from "@/lib/queries/participant-preview";
import { getApprovedCountsByEvent } from "@/lib/queries/event-counts";
import { getApprovedCountFromResult } from "@/lib/utils/event-counts-map";
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

  const countsResult = await getApprovedCountsByEvent(
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
    <div className="flex flex-col gap-8">
      <Link
        href="/events?tab=gyms"
        className="w-fit text-xs font-bold tracking-wide text-zinc-500 hover:text-orange-600"
      >
        ← BACK TO GYMS
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
          className="block border border-zinc-300 py-3 text-center text-sm font-semibold text-zinc-800 hover:border-zinc-500"
        >
          체육관 정보 수정
        </Link>
      )}

      <section id="gym-upcoming-events" className="scroll-mt-4 border-t border-zinc-300 pt-5">
        <p className="text-[10px] font-black tracking-[0.16em] text-zinc-400">
          UPCOMING
        </p>
        <h2 className="mt-1 text-lg font-black tracking-[-0.02em] text-zinc-950">
          예정 이벤트
        </h2>

        {!upcomingEvents?.length ? (
          <p className="mt-4 border-y border-zinc-200 py-5 text-sm text-zinc-500">
            예정된 이벤트가 없습니다.
          </p>
        ) : (
          <ul className="mt-3 border-t border-zinc-200">
            {upcomingEvents.map((event) => {
              const approved = getApprovedCountFromResult(
                countsResult,
                event.id,
              );
              const participantLine =
                approved == null
                  ? "인원 확인 불가"
                  : event.max_participants != null && event.max_participants > 0
                    ? `${approved}/${event.max_participants}명`
                    : `${approved}명`;

              return (
                <li key={event.id} className="border-b border-zinc-200">
                  <Link
                    href={`/events/${event.id}`}
                    className="group block py-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[10px] font-black tracking-[0.12em] text-orange-600">
                        {event.sport} · {formatEventType(event.event_type)}
                      </p>
                      <span className="text-xs text-zinc-400 transition group-hover:translate-x-0.5">
                        →
                      </span>
                    </div>
                    <p className="mt-2 text-base font-bold leading-6 text-zinc-950 group-hover:text-orange-700">
                      {event.title}
                    </p>
                    <p className="mt-2 text-sm text-zinc-600">
                      {formatEventDetailDate(event.event_date)}
                      {event.region ? ` · ${event.region}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1.5">
                        <AppIcon name="users" className="size-3.5" />
                        {participantLine}
                      </span>
                      <span>{formatEventFeeDisplay(event.fee_amount)}</span>
                    </div>
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
