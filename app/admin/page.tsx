import Link from "next/link";
import { getAdminViewer } from "@/lib/admin/auth";
import {
  getAdminOverview,
  getAdminRecentActivity,
} from "@/lib/queries/admin";
import {
  ADMIN_PATHS,
  adminActivityHref,
  formatAdminActivity,
  formatAdminDateTime,
} from "@/lib/utils/admin";

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
      <span className="font-mono text-lg tabular-nums text-zinc-950">{value}</span>
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
      className="flex items-baseline justify-between border-b border-zinc-200 py-3"
    >
      <span className="text-sm text-zinc-950">{label}</span>
      <span className="font-mono text-lg tabular-nums text-zinc-950">
        {value} →
      </span>
    </Link>
  );
}

export default async function AdminHomePage() {
  const { supabase } = await getAdminViewer();
  const [overview, activity] = await Promise.all([
    getAdminOverview(supabase),
    getAdminRecentActivity(supabase),
  ]);

  return (
    <div>
      <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">
        TODAY
      </p>
      <section className="mt-4">
        <StatRow label="신규 사용자" value={overview.newUsersToday} />
        <StatRow label="오늘 신청" value={overview.applicationsToday} />
        <StatRow label="오늘 공개된 이벤트" value={overview.eventsPublishedToday} />
        <StatRow label="오늘 진행 이벤트" value={overview.activeEventsToday} />
      </section>

      <section className="mt-10">
        <p className="text-[10px] font-black tracking-[0.18em] text-orange-600">
          NEEDS ATTENTION
        </p>
        <div className="mt-4">
          <AttentionLink
            href={`${ADMIN_PATHS.applications}?status=pending`}
            label="대기 신청"
            value={overview.pendingApplicationCount}
          />
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
        <StatRow label="오늘 진행 이벤트" value={overview.activeEventsToday} />
        <StatRow label="앞으로 7일 이벤트" value={overview.eventsNext7Days} />
        <StatRow label="진행 중 신청" value={overview.activeApplicationCount} />
      </section>

      <section className="mt-10">
        <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">
          RECENT ACTIVITY
        </p>
        {activity.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">최근 기록이 없습니다.</p>
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
                        className="underline underline-offset-4"
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
