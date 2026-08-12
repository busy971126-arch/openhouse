import Link from "next/link";
import { DashboardEventCard } from "@/components/dashboard/DashboardEventCard";
import { EmptyState } from "@/components/EmptyState";
import { HomeNotificationsSection } from "@/components/home/HomeNotificationsSection";
import { HostGymListCard } from "@/components/host/HostGymListCard";
import type { DashboardEvent } from "@/lib/queries/dashboard";
import type { Gym } from "@/lib/types/database";

const EVENT_PREVIEW_LIMIT = 3;

type HostHomeProps = {
  displayLabel: string;
  pendingApprovals: number;
  operatingEvents: DashboardEvent[];
  gyms: Gym[];
};

export function HostHome({
  displayLabel,
  pendingApprovals,
  operatingEvents,
  gyms,
}: HostHomeProps) {
  const firstPendingEvent = operatingEvents.find(
    (event) => event.counts.pending > 0,
  );
  const eventPreview = operatingEvents.slice(0, EVENT_PREVIEW_LIMIT);

  return (
    <>
      <section>
        <p className="text-sm font-medium text-orange-600">
          {displayLabel}님, 안녕하세요
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight text-zinc-900">
          오늘 운영할 일을
          <br />
          확인하세요
        </h1>
      </section>

      {pendingApprovals > 0 && (
        <Link
          href={
            firstPendingEvent
              ? `/host/participants?gym=${firstPendingEvent.gym_id}&event=${firstPendingEvent.id}`
              : "/host/gyms"
          }
          className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 hover:bg-orange-100"
        >
          <div>
            <p className="text-sm font-semibold text-orange-900">오늘 처리할 일</p>
            <p className="mt-0.5 text-sm text-orange-800">
              승인 대기 참가자 {pendingApprovals}명
            </p>
          </div>
          <span className="text-orange-600">→</span>
        </Link>
      )}

      <HomeNotificationsSection />

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-900">운영 중인 일정</h2>
          {operatingEvents.length > 0 && (
            <Link
              href="/host/gyms"
              className="text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              전체 보기 →
            </Link>
          )}
        </div>

        {eventPreview.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {eventPreview.map((event) => (
              <DashboardEventCard key={event.id} event={event} />
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <EmptyState message="운영 중인 일정이 없습니다." />
            <Link
              href={gyms[0] ? `/host/gyms/${gyms[0].id}/events` : "/host/gyms"}
              className="mt-3 block text-center text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              + 이벤트 만들기
            </Link>
          </div>
        )}
      </section>

      {gyms.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-900">내 체육관</h2>
            <Link
              href="/host/gyms"
              className="text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              관리 →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {gyms.map((gym) => (
              <HostGymListCard key={gym.id} gym={gym} />
            ))}
          </div>
        </section>
      )}

      <Link
        href="/events"
        className="flex items-center justify-between rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:border-orange-300 hover:bg-orange-50/40"
      >
        <span>다른 체육관 · 이벤트 둘러보기</span>
        <span className="text-orange-600">→</span>
      </Link>
    </>
  );
}
