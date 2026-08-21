import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { Alert } from "@/components/Alert";
import { getHostGymById } from "@/lib/queries/host-gyms";
import { getHostEventsForGym, type HostEventOption } from "@/lib/queries/host-participants";
import { formatEventDetailDate } from "@/lib/utils/date";
import { getEventRecruitmentStatus } from "@/lib/utils/event-status";

type PageProps = {
  params: Promise<{ gymId: string }>;
};

function getHostEventBadge(event: HostEventOption) {
  if (event.status === "draft") {
    return {
      label: "작성 중 · 비공개",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  if (event.status === "cancelled") {
    return {
      label: "취소",
      className: "bg-red-50 text-red-700 border-red-200",
    };
  }

  const activeCount = event.counts.approved + event.counts.pending;
  const recruitmentStatus = getEventRecruitmentStatus({
    eventDate: event.eventDate,
    eventTime: event.eventTime,
    maxParticipants: event.maxParticipants,
    approvedCount: activeCount,
    recruitmentClosed: event.recruitmentClosed,
    registrationDeadline: event.registrationDeadline,
    eventStatus: event.status,
  });

  if (recruitmentStatus === "ended") {
    return {
      label: "종료",
      className: "bg-zinc-100 text-zinc-600 border-zinc-200",
    };
  }

  if (recruitmentStatus === "closed") {
    return {
      label: "모집 마감",
      className: "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (recruitmentStatus === "closing_soon") {
    return {
      label: "마감 임박",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  return {
    label: "모집 중",
    className: "bg-green-50 text-green-700 border-green-200",
  };
}

export default async function HostGymEventsPage({ params }: PageProps) {
  const { gymId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/host/gyms/${gymId}/events`)}`);
  }

  const gym = await getHostGymById(user.id, gymId);
  if (!gym) notFound();

  const { events, error: eventsError } = await getHostEventsForGym(gymId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/host/gyms/${gymId}`}
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        ← {gym.name}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">이벤트 관리</h1>
        <p className="mt-1 text-sm text-zinc-600">{gym.name}</p>
      </div>

      <Link
        href={`/events/new?gym=${gymId}`}
        className="block rounded-xl bg-orange-600 py-3 text-center text-sm font-semibold text-white hover:bg-orange-700"
      >
        + 이벤트 추가
      </Link>

      {eventsError ? (
        <Alert message="일정을 불러오지 못했습니다." />
      ) : events.length === 0 ? (
        <EmptyState message="등록된 이벤트가 없습니다." />
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => {
            const activeCount = event.counts.approved + event.counts.pending;
            const badge = getHostEventBadge(event);

            return (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}/edit`}
                  className="block rounded-xl border border-zinc-200 bg-white px-4 py-4 hover:bg-zinc-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-zinc-500">
                      {formatEventDetailDate(event.eventDate)}
                    </p>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold text-zinc-900">{event.title}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    참가 {activeCount}명
                    {event.maxParticipants != null && event.maxParticipants > 0
                      ? ` / ${event.maxParticipants}명`
                      : ""}
                    {event.counts.pending > 0 && (
                      <span className="ml-2 text-orange-600">
                        · 대기 {event.counts.pending}명
                      </span>
                    )}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
