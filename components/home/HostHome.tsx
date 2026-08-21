import Link from "next/link";
import { DashboardEventCard } from "@/components/dashboard/DashboardEventCard";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { EmptyState } from "@/components/EmptyState";
import { HomeNotificationsSection } from "@/components/home/HomeNotificationsSection";
import { HostGymListCard } from "@/components/host/HostGymListCard";
import { AppIcon, type AppIconName } from "@/components/ui/AppIcon";
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
      <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">{title}</h3>
      <ul className="flex flex-col gap-3">
        {events.map((event) => (
          <DashboardEventCard key={event.id} event={event} />
        ))}
      </ul>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: AppIconName;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-20 flex-col justify-between border border-zinc-200 bg-white p-3 text-left transition hover:border-zinc-400"
    >
      <AppIcon name={icon} className="size-5 text-orange-600" />
      <span className="mt-3 text-xs font-bold text-zinc-900">{label}</span>
    </Link>
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
  const { todayEvents, upcomingEvents } = splitHostOperatingEvents(operatingEvents);
  const upcomingPreview = upcomingEvents.slice(0, UPCOMING_PREVIEW_LIMIT);
  const participantsHref = getHostParticipantsHref(allEvents, gyms);
  const newEventHref = getHostNewEventHref(gyms);
  const primaryGym = gyms[0] ?? null;

  return (
    <>
      <section className="pt-1">
        <p className="text-[10px] font-black tracking-[0.18em] text-orange-600">HOST MODE</p>
        <p className="mt-4 text-sm font-medium text-zinc-600">{displayLabel}님</p>
        <h1 className="mt-1 text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-zinc-950">
          오늘 운영할 일
        </h1>
      </section>

      {pendingApprovals > 0 ? (
        <Link
          href={participantsHref}
          className="flex items-center justify-between border-l-2 border-orange-600 py-2 pl-4"
        >
          <div>
            <p className="text-sm font-bold text-zinc-950">승인 대기 {pendingApprovals}명</p>
            <p className="mt-1 text-xs text-zinc-500">참가자 관리에서 확인</p>
          </div>
          <span className="text-sm font-bold text-orange-600">→</span>
        </Link>
      ) : (
        <section className="border-y border-zinc-200 py-3">
          <p className="text-sm font-semibold text-zinc-900">승인 대기 없음</p>
          {tomorrowEvents > 0 && (
            <p className="mt-1 text-xs text-zinc-500">내일 진행 일정 {tomorrowEvents}개</p>
          )}
        </section>
      )}

      <section className="grid grid-cols-3 gap-2">
        <QuickAction href={participantsHref} icon="users" label="예정 참가자" />
        <QuickAction href={newEventHref} icon="calendar" label="이벤트" />
        <QuickAction
          href={primaryGym ? `/host/gyms/${primaryGym.id}` : "/host/gyms"}
          icon="building"
          label="체육관"
        />
      </section>

      <DashboardSummary {...stats} />

      <section className="flex flex-col gap-4 border-t border-zinc-200 pt-5">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">OPERATIONS</p>
            <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-zinc-950">운영 일정</h2>
          </div>
          {operatingEvents.length > 0 && (
            <Link
              href={primaryGym ? `/host/gyms/${primaryGym.id}/events` : "/host/gyms"}
              className="text-xs font-semibold text-zinc-600 hover:text-orange-600"
            >
              전체 보기 →
            </Link>
          )}
        </div>

        {operatingEvents.length > 0 ? (
          <>
            <HostEventList title="TODAY" events={todayEvents} />
            <HostEventList title="UP NEXT" events={upcomingPreview} />
          </>
        ) : (
          <div className="border-y border-zinc-200 py-4">
            <EmptyState message="운영 중인 일정이 없습니다." />
            <Link
              href={newEventHref}
              className="mt-3 block text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              이벤트 만들기 →
            </Link>
          </div>
        )}
      </section>

      <HomeNotificationsSection />

      {gyms.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-zinc-200 pt-5">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">MY GYMS</p>
              <h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-zinc-950">내 체육관</h2>
            </div>
            <Link
              href="/host/gyms"
              className="text-xs font-semibold text-zinc-600 hover:text-orange-600"
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

      <section className="border-t border-zinc-200 pt-5">
        <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">PARTICIPANT MODE</p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-950">나도 운동하러 가기</h2>
            <p className="mt-1 text-xs text-zinc-500">운영자 계정 그대로 참가할 수 있어요.</p>
          </div>
          <div className="flex shrink-0 gap-3 text-xs font-semibold">
            <Link href="/my/registrations" className="text-zinc-600 hover:text-orange-600">내 일정</Link>
            <Link href="/events" className="text-orange-600 hover:text-orange-700">이벤트 찾기</Link>
          </div>
        </div>
      </section>
    </>
  );
}
