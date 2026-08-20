import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { Alert } from "@/components/Alert";
import { getHostGymById } from "@/lib/queries/host-gyms";
import { getHostEventsForGym } from "@/lib/queries/host-participants";
import { formatEventDetailDate } from "@/lib/utils/date";

type PageProps = {
  params: Promise<{ gymId: string }>;
};

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

            return (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}/edit`}
                  className="block rounded-xl border border-zinc-200 bg-white px-4 py-4 hover:bg-zinc-50"
                >
                  <p className="text-xs text-zinc-500">
                    {formatEventDetailDate(event.eventDate)}
                  </p>
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
