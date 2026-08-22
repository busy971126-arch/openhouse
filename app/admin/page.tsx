import Link from "next/link";
import { getAdminViewer } from "@/lib/admin/auth";
import {
  getAdminOverview,
  getAdminRecentActivity,
} from "@/lib/queries/admin";
import { ADMIN_PATHS, formatAdminDateTime } from "@/lib/utils/admin";

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

function actionLabel(action: string, targetType: string): string {
  if (action === "inquiry.update") return "문의 처리";
  if (action === "report.update") return "신고 상태 변경";
  return `${targetType} ${action}`;
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
        OVERVIEW
      </p>

      <section className="mt-4">
        <StatRow label="Users" value={overview.userCount} />
        <StatRow label="Gyms" value={overview.gymCount} />
        <StatRow label="Events" value={overview.publicEventCount} />
        <StatRow label="Draft events" value={overview.draftEventCount} />
        <StatRow label="Applications" value={overview.activeApplicationCount} />
      </section>

      <section className="mt-10">
        <p className="text-[10px] font-black tracking-[0.18em] text-orange-600">
          NEEDS ATTENTION
        </p>
        <Link
          href={ADMIN_PATHS.inquiries}
          className="mt-4 flex items-baseline justify-between border-b border-zinc-200 py-3"
        >
          <span className="text-sm text-zinc-950">Inquiries</span>
          <span className="font-mono text-lg tabular-nums text-zinc-950">
            {overview.openInquiryCount} →
          </span>
        </Link>
        <Link
          href={ADMIN_PATHS.reports}
          className="flex items-baseline justify-between border-b border-zinc-200 py-3"
        >
          <span className="text-sm text-zinc-950">Reports</span>
          <span className="font-mono text-lg tabular-nums text-zinc-950">
            {overview.openReportCount} →
          </span>
        </Link>
        <Link
          href={`${ADMIN_PATHS.events}?status=draft`}
          className="flex items-baseline justify-between border-b border-zinc-200 py-3"
        >
          <span className="text-sm text-zinc-950">Draft events</span>
          <span className="font-mono text-lg tabular-nums text-zinc-950">
            {overview.draftEventCount} →
          </span>
        </Link>
      </section>

      <section className="mt-10">
        <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">
          RECENT ACTIVITY
        </p>
        {activity.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">최근 처리 기록이 없습니다.</p>
        ) : (
          <ul className="mt-4">
            {activity.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-4 border-b border-zinc-200 py-3"
              >
                <span className="text-sm text-zinc-950">
                  {actionLabel(item.action, item.targetType)}
                </span>
                <time className="shrink-0 text-xs text-zinc-500">
                  {formatAdminDateTime(item.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
