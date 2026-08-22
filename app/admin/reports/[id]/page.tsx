import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminViewer } from "@/lib/admin/auth";
import { getAdminReport } from "@/lib/queries/admin";
import { formatAdminDateTime } from "@/lib/utils/admin";
import { ReportStatusForm } from "@/components/admin/ReportStatusForm";
import {
  REPORT_CATEGORY_OPTIONS,
  REPORT_STATUS_LABELS,
} from "@/lib/constants/support";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase } = await getAdminViewer();
  const report = await getAdminReport(supabase, id);
  if (!report) notFound();

  const category =
    REPORT_CATEGORY_OPTIONS.find((option) => option.value === report.category)
      ?.label ?? report.category;

  return (
    <div>
      <Link
        href="/admin/reports"
        className="text-xs font-semibold tracking-wide text-zinc-500 hover:text-zinc-950"
      >
        ← REPORTS
      </Link>
      <p className="mt-6 text-[10px] font-black tracking-[0.18em] text-zinc-400">
        REPORT
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-zinc-950">
        {category}
      </h1>
      <p className="mt-3 text-sm text-zinc-600">
        신고자 {report.reporterLabel}
        {report.reportedUserLabel ? ` · 대상 ${report.reportedUserLabel}` : ""}
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        {REPORT_STATUS_LABELS[report.status] ?? report.status} ·{" "}
        {formatAdminDateTime(report.createdAt)}
      </p>
      {report.eventTitle && report.eventId && (
        <Link
          href={`/admin/events/${report.eventId}`}
          className="mt-3 inline-block text-sm font-semibold text-zinc-950 underline underline-offset-4"
        >
          {report.eventTitle}
        </Link>
      )}
      <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-zinc-800">
        {report.description}
      </p>
      <ReportStatusForm reportId={report.id} initialStatus={report.status} />
    </div>
  );
}
