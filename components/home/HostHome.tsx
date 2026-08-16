import Link from "next/link";
import { DashboardEventCard } from "@/components/dashboard/DashboardEventCard";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { EmptyState } from "@/components/EmptyState";
import { HomeNotificationsSection } from "@/components/home/HomeNotificationsSection";
import { HostGymListCard } from "@/components/host/HostGymListCard";
import type { DashboardEvent } from "@/lib/queries/dashboard";
import type { Gym } from "@/lib/types/database";
import {
  getHostNewEventHref,
  getHostParticipantsHref,
  splitHostOperatingEvents,
} from "@/lib/utils/host-home";

const UPCOMING_PREVIEW_LIMIT = 3;

type HostHomeStats = {
  gymCount: number;
  operatingEventCount: number;
  totalApplications: number;
  pendingApprovals: number;
};

type HostHomeProps = {
  displayLabel: string;
  pendingApprovals: number;
  tomorrowEvents: number;
  allEvents: DashboardEvent[];
  operatingEvents: DashboardEvent[];
  gyms: Gym[];
  stats: HostHomeStats;
};

function HostEventList({
  title,
  events,
}: {
  title: string;
  events: DashboardEvent[];
}) {
  if (events.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-zinc-700">{title}</h3>
      <ul className="flex flex-col gap-3">
        {events.map((event) => (
          <DashboardEventCard key={event.id} event={event} />
        ))}
      </ul>
    </div>
  );
}

export function HostHome({
  displayLabel,
  pendingApprovals,
  tomorrowEvents,
  allEvents,
  operatingEvents,
  gyms,
  stats,
}: HostHomeProps) {
  const { todayEvents, upcomingEvents } =
    splitHostOperatingEvents(operatingEvents);
  const upcomingPreview = upcomingEvents.slice(0, UPCOMING_PREVIEW_LIMIT);
  const participantsHref = getHostParticipantsHref(allEvents, gyms);
  const newEventHref = getHostNewEventHref(gyms);
  const primaryGym = gyms[0] ?? null;

  return (
    <>
      <section>
        <p className="text-sm font-medium text-orange-600">
          {displayLabel}님, 안녕하세요
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight text-zinc-900">
          오늘 운영할 일을 확인하세요
        </h1>
      </section>

      {pendingApprovals > 0 ? (
        <Link
          href={participantsHref}
          className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 hover:bg-orange-100"
        >
          <div>
            <p className="text-sm font-semibold text-orange-900">
              승인 대기 {pendingApprovals}명
            </p>
            <p className="mt-0.5 text-sm text-orange-800">
              참가자 관리에서 바로 처리하세요
            </p>
          </div>
          <span className="text-orange-600">→</span>
        </Link>
      ) : (
        <section className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <p className="text-sm font-medium text-zinc-900">
            처리할 승인 대기가 없습니다
          </p>
          {tomorrowEvents > 0 && (
            <p className="mt-1 text-sm text-zinc-600">
              내일 진행 일정 {tomorrowEvents}개
            </p>
          )}
        </section>
      )}

      <section className="grid grid-cols-3 gap-2">
        <Link
          href={participantsHref}
          className="rounded-xl border border-zinc-200 bg-white px-2 py-3 text-center text-xs font-medium text-zinc-800 hover:border-orange-200 hover:bg-orange-50/40"
        >
          👥
          <span className="mt-1 block">예정 참가자</span>
        </Link>
        <Link
          href={newEventHref}
          className="rounded-xl border border-zinc-200 bg-white px-2 py-3 text-center text-xs font-medium text-zinc-800 hover:border-orange-200 hover:bg-orange-50/40"
        >
          📅
          <span className="mt-1 block">이벤트</span>
        </Link>
        <Link
          href={primaryGym ? `/host/gyms/${primaryGym.id}` : "/host/gyms"}
          className="rounded-xl border border-zinc-200 bg-white px-2 py-3 text-center text-xs font-medium text-zinc-800 hover:border-orange-200 hover:bg-orange-50/40"
        >
          🏠
          <span className="mt-1 block">체육관</span>
        </Link>
      </section>

      <DashboardSummary {...stats} />

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-900">운영 일정</h2>
          {operatingEvents.length > 0 && (
            <Link
              href={primaryGym ? `/host/gyms/${primaryGym.id}/events` : "/host/gyms"}
              className="text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              전체 보기 →
            </Link>
          )}
        </div>

        {operatingEvents.length > 0 ? (
          <>
            <HostEventList title="오늘" events={todayEvents} />
            <HostEventList title="다가오는 일정" events={upcomingPreview} />
          </>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <EmptyState message="운영 중인 일정이 없습니다." />
            <Link
              href={newEventHref}
              className="mt-3 block text-center text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              + 이벤트 만들기
            </Link>
          </div>
        )}
      </section>

      <HomeNotificationsSection />

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

      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <h2 className="text-sm font-semibold text-zinc-900">참가자로 이용하기</h2>
        <p className="mt-1 text-xs text-zinc-500">
          운영자도 다른 이벤트에 참가할 수 있습니다.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href="/my/registrations"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            내 일정
          </Link>
          <Link
            href="/events"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            이벤트 찾기
          </Link>
        </div>
      </section>
    </>
  );
}
