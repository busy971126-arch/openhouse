import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEvent } from "@/lib/queries/events";
import { formatEventDetailDate, formatEventTimeDisplay } from "@/lib/utils/date";
import { formatEventType } from "@/lib/constants/event-types";
import {
  getDefaultScheduleTabForEventDate,
  scheduleTabHref,
} from "@/lib/utils/my-schedule";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApplyCompletePage({ params }: PageProps) {
  const { id: eventId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect=/events/${eventId}/apply/complete`);

  const [{ data: event }, { data: registration }] = await Promise.all([
    getEvent(eventId),
    supabase
      .from("registrations")
      .select("id, status, seeking_sparring_partner")
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .in("status", ["pending", "approved"])
      .maybeSingle(),
  ]);

  if (!event || !registration) {
    redirect(`/events/${eventId}`);
  }

  const scheduleTab = getDefaultScheduleTabForEventDate(event.event_date);
  const timeLabel = formatEventTimeDisplay(event.event_time);

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-3xl">✅</p>
        <h1 className="mt-3 text-xl font-bold text-zinc-900">신청이 완료되었습니다</h1>
        <p className="mt-2 text-sm text-zinc-600">
          호스트 승인 후 참가가 확정됩니다. 내 일정에서 상태를 확인할 수
          있습니다.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-xs font-medium text-orange-600">신청한 이벤트</p>
        <h2 className="mt-1 text-lg font-semibold text-zinc-900">{event.title}</h2>
        <div className="mt-3 space-y-1 text-sm text-zinc-600">
          <p>
            📅 {formatEventDetailDate(event.event_date)}
            {timeLabel ? ` · ${timeLabel}` : ""}
          </p>
          <p>
            📍 {event.region}
            {event.gyms?.name ? ` · ${event.gyms.name}` : ""}
          </p>
          <p>{formatEventType(event.event_type)} · {event.sport}</p>
        </div>
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          🟡 승인 대기 중
        </p>
        {registration.seeking_sparring_partner && (
          <p className="mt-2 text-sm text-zinc-600">
            대련 상대 찾기도 함께 등록되었습니다.
          </p>
        )}
      </section>

      <div className="flex flex-col gap-3">
        <Link
          href={`${scheduleTabHref(scheduleTab)}&applied=1`}
          className="rounded-xl bg-orange-600 py-3.5 text-center text-base font-semibold text-white hover:bg-orange-700"
        >
          내 일정 보기
        </Link>
        <Link
          href={`/events/${eventId}`}
          className="rounded-xl border border-zinc-300 bg-white py-3.5 text-center text-base font-medium text-zinc-800 hover:bg-zinc-50"
        >
          이벤트 상세로 돌아가기
        </Link>
      </div>
    </div>
  );
}
