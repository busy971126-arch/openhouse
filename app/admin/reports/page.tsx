import Link from "next/link";
import { getAdminViewer } from "@/lib/admin/auth";
import { getAdminReports } from "@/lib/queries/admin";
import { formatAdminDateTime } from "@/lib/utils/admin";
import { REPORT_CATEGORY_OPTIONS, REPORT_STATUS_LABELS } from "@/lib/constants/support";

export default async function AdminReportsPage() {
  const { supabase } = await getAdminViewer();
  const items = await getAdminReports(supabase);

  return (
    <div>
      <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">
        REPORTS
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-zinc-950">
        신고
      </h1>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">접수된 신고가 없습니다.</p>
      ) : (
        <ul className="mt-6">
          {items.map((item) => {
            const category =
              REPORT_CATEGORY_OPTIONS.find((option) => option.value === item.category)
                ?.label ?? item.category;

            return (
              <li key={item.id} className="border-b border-zinc-200 py-4">
                <Link href={`/admin/reports/${item.id}`} className="block">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-950">{category}</p>
                    <span className="text-xs text-zinc-500">
                      {REPORT_STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">
                    {item.reporterLabel}
                    {item.reportedUserLabel ? ` → ${item.reportedUserLabel}` : ""}
                  </p>
                  {item.eventTitle && (
                    <p className="mt-1 text-sm text-zinc-500">{item.eventTitle}</p>
                  )}
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-700">
                    {item.description}
                  </p>
                  <time className="mt-2 block text-xs text-zinc-400">
                    {formatAdminDateTime(item.createdAt)}
                  </time>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
