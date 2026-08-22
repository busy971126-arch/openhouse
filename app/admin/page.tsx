import Link from "next/link";
import { getAdminViewer } from "@/lib/admin/auth";
import {
  getAdminApplications,
  getAdminEvents,
  getAdminOverview,
  getAdminRecentActivity,
  type AdminApplicationListItem,
  type AdminEventListItem,
} from "@/lib/queries/admin";
import {
  ADMIN_PATHS,
  adminActivityHref,
  adminApplicationPath,
  adminEventPath,
  formatAdminActivity,
  formatAdminDateTime,
} from "@/lib/utils/admin";

function NumberValue({ value }: { value: number }) {
  return (
    <span className="text-lg font-semibold tabular-nums text-zinc-950">
      {value}
    </span>
  );
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-zinc-200 py-3">
      <span className="text-sm text-zinc-600">{label}</span>
      <NumberValue value={value} />
    </div>
  );
}

function AttentionLink({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: number;
}) {
  return (
    <Link
      href={href}
      className="group flex items-baseline justify-between border-b border-zinc-200 py-3"
    >
      <span className="text-sm text-zinc-950 group-hover:text-orange-600">
        {label}
      </span>
      <span className="flex items-center gap-3 text-zinc-950">
        <NumberValue value={value} />
        <span aria-hidden="true" className="text-lg">
          →
        </span>
      </span>
    </Link>
  );
}

function PendingApplicationRow({
  application,
}: {
  application: AdminApplicationListItem;
}) {
  return (
    <Link
      href={adminApplicationPath(application.id)}
      className="group block border-b border-zinc-200 py-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-950 group-hover:text-orange-600">
              {application.participantLabel}
            </span>
            <span className="text-[9px] font-black tracking-[0.14em] text-orange-600">
              PENDING
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-zinc-700">
            {application.eventTitle}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {application.gymName} · {formatAdminDateTime(application.createdAt)}
          </p>
        </div>
        <span aria-hidden="true" className="mt-1 shrink-0 text-lg text-zinc-950">
          →
        </span>
      </div>
    </Link>
  );
}

function EventRow({
  event,
  showDate = false,
}: {
  event: AdminEventListItem;
  showDate?: boolean;
}) {
  return (
    <Link
      href={adminEventPath(event.id)}
      className="group block border-b border-zinc-200 py-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {showDate ? (
              <span className="text-[10px] font-black tracking-[0.12em] text-zinc-400">
                {formatShortDate(event.eventDate)}
              </span>
            ) : null}
            <span className="truncate text-sm font-semibold text-zinc-950 group-hover:text-orange-600">
              {event.title}
            </span>
            {event.isPaused ? (
              <span className="text-[9px] font-black tracking-[0.12em] text-orange-600">
                PAUSED
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {event.gymName} · 신청 {event.applicationCount}
          </p>
        </div>
        <span aria-hidden="true" className="mt-1 shrink-0 text-lg text-zinc-950">
          →
        </span>
      </div>
    </Link>
  );
}

function kstDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatShortDate(dateKey: string): string {
  const [, month = "", day = ""] = dateKey.split("-");
  return `${month}.${day}`;
}

export default async function AdminHomePage() {
  const { supabase } = await getAdminViewer();
  const [overview, activity, pendingApplications, activeEvents] =
    await Promise.all([
      getAdminOverview(supabase),
      getAdminRecentActivity(supabase),
      getAdminApplications(supabase, { status: "pending" }),
      getAdminEvents(supabase, { status: "active" }),
    ]);

  const today = kstDateKey();
  const next7 = addDays(today, 7);
  const attentionApplications = pendingApplications.slice(0, 3);
  const todayEvents = activeEvents
    .filter((event) => !event.isHidden && event.eventDate === today)
    .slice(0, 5);
  const upcomingEvents = activeEvents
    .filter(
      (event) =>
        !event.isHidden &&
        event.eventDate > today &&
        event.eventDate <= next7,
    )
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .slice(0, 5);

  return (
    <div>
      <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">
        TODAY
      </p>
      <section className="mt-4">
        <StatRow label="신규 사용자" value={overview.newUsersToday} />
        <StatRow label="오늘 신청" value={overview.applicationsToday} />
        <StatRow
          label="오늘 공개된 이벤트"
          value={overview.eventsPublishedToday}
        />
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.18em] text-orange-600">
              NEEDS ATTENTION
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              지금 확인하거나 처리할 운영 항목입니다.
            </p>
          </div>
          <NumberValue value={overview.pendingApplicationCount} />
        </div>

        <div className="mt-4 border-t border-zinc-300">
          {attentionApplications.length === 0 ? (
            <p className="border-b border-zinc-200 py-4 text-sm text-zinc-500">
              현재 대기 중인 신청이 없습니다.
            </p>
          ) : (
            attentionApplications.map((application) => (
              <PendingApplicationRow
                key={application.id}
                application={application}
              />
            ))
          )}
        </div>

        {overview.pendingApplicationCount > 0 ? (
          <Link
            href={`${ADMIN_PATHS.applications}?status=pending`}
            className="mt-4 inline-flex text-[10px] font-black tracking-[0.14em] text-zinc-950 hover:text-orange-600"
          >
            VIEW ALL APPLICATIONS →
          </Link>
        ) : null}

        <div className="mt-6">
          <AttentionLink
            href={ADMIN_PATHS.inquiries}
            label="미답변 문의"
            value={overview.openInquiryCount}
          />
          <AttentionLink
            href={ADMIN_PATHS.reports}
            label="미해결 신고"
            value={overview.openReportCount}
          />
          <AttentionLink
            href={`${ADMIN_PATHS.events}?status=draft`}
            label="Draft 이벤트"
            value={overview.draftEventCount}
          />
        </div>
      </section>

      <section className="mt-10">
        <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">
          LIVE OPERATIONS
        </p>

        <div className="mt-5 flex items-baseline justify-between border-b border-zinc-300 pb-2">
          <h2 className="text-sm font-semibold text-zinc-950">오늘 진행</h2>
          <NumberValue value={overview.activeEventsToday} />
        </div>
        {todayEvents.length === 0 ? (
          <p className="border-b border-zinc-200 py-4 text-sm text-zinc-500">
            오늘 진행 중인 공개 이벤트가 없습니다.
          </p>
        ) : (
          todayEvents.map((event) => <EventRow key={event.id} event={event} />)
        )}

        <div className="mt-8 flex items-baseline justify-between border-b border-zinc-300 pb-2">
          <h2 className="text-sm font-semibold text-zinc-950">앞으로 7일</h2>
          <NumberValue value={overview.eventsNext7Days} />
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="border-b border-zinc-200 py-4 text-sm text-zinc-500">
            앞으로 7일 안에 예정된 공개 이벤트가 없습니다.
          </p>
        ) : (
          upcomingEvents.map((event) => (
            <EventRow key={event.id} event={event} showDate />
          ))
        )}

        <div className="mt-6">
          <StatRow label="진행 중 신청" value={overview.activeApplicationCount} />
        </div>
      </section>

      <section className="mt-10">
        <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">
          RECENT ACTIVITY
        </p>
        {activity.length === 0 ? (
          <div className="mt-4 border-y border-zinc-200 py-5">
            <p className="text-sm font-medium text-zinc-700">
              아직 새로운 운영 활동이 없습니다.
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              새로운 신청·이벤트 공개·관리자 조치가 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <ul className="mt-4">
            {activity.map((item) => {
              const href = adminActivityHref(item);
              return (
                <li
                  key={item.id}
                  className="flex items-baseline justify-between gap-4 border-b border-zinc-200 py-3"
                >
                  <span className="text-sm text-zinc-950">
                    {href ? (
                      <Link
                        href={href}
                        className="underline underline-offset-4 hover:text-orange-600"
                      >
                        {formatAdminActivity(item.action, item.actorType)}
                      </Link>
                    ) : (
                      formatAdminActivity(item.action, item.actorType)
                    )}
                    <span className="ml-2 text-xs text-zinc-400">
                      {item.actorType}
                    </span>
                  </span>
                  <time className="shrink-0 text-xs text-zinc-500">
                    {formatAdminDateTime(item.occurredAt)}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
