import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAnnouncements,
  getApprovedCount,
  getEvent,
  getUserRegistrationForEvent,
} from "@/lib/queries/events";
import {
  getEventParticipantPreview,
  isGymFollowed,
} from "@/lib/queries/participant-preview";
import { isEventInterested } from "@/lib/queries/event-interests";
import { getUpcomingEventsForGym } from "@/lib/queries/gyms";
import { getEventRecruitmentStatus } from "@/lib/utils/event-status";
import { AnnouncementForm } from "./AnnouncementForm";
import { AnnouncementItem } from "@/components/events/AnnouncementItem";
import { EventDetailActions } from "@/components/events/EventDetailActions";
import { EventDetailHeader } from "@/components/events/EventDetailHeader";
import { EventGymSection } from "@/components/events/EventGymSection";
import { EventParticipantPreview } from "@/components/events/EventParticipantPreview";
import { EventSafetyInfo } from "@/components/events/EventSafetyInfo";
import { EventVisitInfo } from "@/components/events/EventVisitInfo";
import { InterestHeart } from "@/components/interest/InterestHeart";
import {
  getAcceptedFriendIdsForViewer,
  getProfileVisibilitySettingsMap,
} from "@/lib/queries/profile-visibility";
import { getEventDisplayAddress } from "@/lib/utils/event-location";
import { resolveViewerWeightClass } from "@/lib/utils/participant-preview";
import type { Gym } from "@/lib/types/database";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: event, error } = await getEvent(id);
  if (error || !event) notFound();

  const [
    { data: registration },
    { data: announcements },
    { count: approvedCount },
    { data: preview },
    profileResult,
    gymOperatorResult,
    ownedGymResult,
    lastGymAffiliationResult,
  ] = await Promise.all([
    user
      ? getUserRegistrationForEvent(user.id, id)
      : Promise.resolve({ data: null }),
    getAnnouncements(id),
    getApprovedCount(id),
    getEventParticipantPreview(id),
    user
      ? supabase
          .from("profiles")
          .select("weight_class, experience, gender")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("gyms")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", user.id)
      : Promise.resolve({ count: 0 }),
    user
      ? supabase
          .from("gyms")
          .select("name")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("registrations")
          .select("gym_affiliation")
          .eq("user_id", user.id)
          .not("gym_affiliation", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isGymOperator = (gymOperatorResult.count ?? 0) > 0;
  const gymAffiliationDefault =
    lastGymAffiliationResult.data?.gym_affiliation?.trim() ||
    ownedGymResult.data?.name?.trim() ||
    null;

  const gym = event.gyms as Pick<
    Gym,
    | "id"
    | "name"
    | "region"
    | "address"
    | "owner_id"
    | "sport"
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
    | "first_visit_welcome"
    | "walk_in_visits"
    | "preparation_guide"
    | "mat_photos"
    | "facility_photos"
    | "exterior_photos"
    | "parking_photos"
  > | null;
  const isOwner = !!(user && gym && gym.owner_id === user.id);

  const participantUserIds = [
    ...new Set([
      ...(preview?.participants.map((participant) => participant.user_id) ?? []),
      ...(preview?.sparring_seekers.map((seeker) => seeker.user_id) ?? []),
    ]),
  ];
  const [friendUserIds, visibilitySettingsMap] = user
    ? await Promise.all([
        getAcceptedFriendIdsForViewer(user.id, participantUserIds),
        getProfileVisibilitySettingsMap(participantUserIds),
      ])
    : [new Set<string>(), new Map()];
  const visibilityByUserId = Object.fromEntries(visibilitySettingsMap);
  const viewerWeightClass = user
    ? resolveViewerWeightClass(
        registration?.apply_weight_class,
        profileResult.data?.weight_class,
      )
    : null;

  const { followed: isFollowed } =
    user && gym
      ? await isGymFollowed(user.id, gym.id)
      : { followed: false };

  const { interested: isInterested } =
    user && !isOwner
      ? await isEventInterested(user.id, id)
      : { interested: false };

  const { data: gymUpcomingEvents } = gym
    ? await getUpcomingEventsForGym(gym.id)
    : { data: [] };

  const otherUpcomingEvents = (gymUpcomingEvents ?? [])
    .filter((item) => item.id !== id)
    .map((item) => ({
      id: item.id,
      title: item.title,
      event_date: item.event_date,
    }));

  const recruitmentStatus = getEventRecruitmentStatus({
    eventDate: event.event_date,
    maxParticipants: event.max_participants,
    approvedCount,
    recruitmentClosed: event.recruitment_closed ?? false,
    registrationDeadline: event.registration_deadline ?? null,
    eventStatus: event.status ?? "active",
  });
  const canApply =
    recruitmentStatus === "recruiting" ||
    recruitmentStatus === "closing_soon";

  const closedReason =
    recruitmentStatus === "closed"
      ? event.registration_deadline &&
        event.registration_deadline < new Date().toISOString().slice(0, 10)
        ? "신청 마감일이 지났습니다."
        : event.recruitment_closed
          ? "모집이 마감되었습니다."
          : "정원이 마감되었습니다."
      : recruitmentStatus === "ended"
        ? "종료된 일정입니다."
        : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/events" className="text-sm text-orange-600 hover:underline">
        ← 이벤트 목록
      </Link>

      <article className="rounded-xl bg-white p-5 shadow-sm">
        <EventDetailHeader
          sport={event.sport}
          title={event.title}
          recruitmentStatus={recruitmentStatus}
          eventDate={event.event_date}
          eventTime={event.event_time}
          region={event.region}
          gymName={gym?.name}
          gymAddress={getEventDisplayAddress(event, gym)}
          feeAmount={event.fee_amount}
          registrationDeadline={event.registration_deadline}
          difficulty={event.difficulty}
          approvedCount={approvedCount}
          maxParticipants={event.max_participants}
          interestSlot={
            !isOwner ? (
              <InterestHeart
                kind="event"
                targetId={id}
                initialInterested={isInterested}
                userId={user?.id ?? null}
                loginRedirect={`/events/${id}`}
                size="sm"
              />
            ) : undefined
          }
        />

        {event.description && (
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <h2 className="text-sm font-semibold text-zinc-900">이벤트 소개</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
              {event.description}
            </p>
          </div>
        )}

        <div className="mt-6">
          <EventParticipantPreview
            preview={preview}
            viewerId={user?.id ?? null}
            viewerWeightClass={viewerWeightClass}
            friendUserIds={[...friendUserIds]}
            visibilityByUserId={visibilityByUserId}
          />
        </div>

        <div className="mt-6">
          <EventDetailActions
            eventId={id}
            event={event}
            userId={user?.id ?? null}
            isOwner={isOwner}
            registration={registration}
            canApply={canApply}
            closedReason={closedReason}
            weightClass={profileResult.data?.weight_class ?? null}
            gender={profileResult.data?.gender ?? null}
            experience={profileResult.data?.experience ?? null}
            isGymOperator={isGymOperator}
            gymAffiliationDefault={gymAffiliationDefault}
            preview={preview}
          />
        </div>

        {!isOwner && user && (
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <Link
              href={`/my/reports?eventId=${id}`}
              className="block text-center text-xs text-zinc-500 hover:text-red-600"
            >
              이 이벤트 신고하기
            </Link>
          </div>
        )}
      </article>

      <EventVisitInfo event={event} />

      <EventSafetyInfo event={event} />

      {gym && (
        <EventGymSection
          gym={gym}
          userId={user?.id ?? null}
          isFollowed={isFollowed}
          loginRedirect={`/events/${id}`}
          showFollow
          variant="event"
          otherUpcomingEvents={otherUpcomingEvents}
        />
      )}

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">공지</h2>
        {announcements?.length ? (
          <ul className="mt-3 space-y-3">
            {announcements.map((a) =>
              isOwner ? (
                <AnnouncementItem
                  key={a.id}
                  id={a.id}
                  content={a.content}
                  createdAt={a.created_at}
                />
              ) : (
                <li
                  key={a.id}
                  className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
                >
                  <p className="whitespace-pre-wrap">{a.content}</p>
                  <time className="mt-1 block text-xs text-zinc-400">
                    {new Date(a.created_at).toLocaleDateString("ko-KR")}
                  </time>
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">등록된 공지가 없습니다.</p>
        )}

        {isOwner && user && (
          <AnnouncementForm eventId={id} userId={user.id} />
        )}
      </section>
    </div>
  );
}
