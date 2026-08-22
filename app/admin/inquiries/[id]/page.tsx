import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminViewer } from "@/lib/admin/auth";
import { getAdminInquiry } from "@/lib/queries/admin";
import { formatAdminDateTime } from "@/lib/utils/admin";
import { InquiryReplyForm } from "@/components/admin/InquiryReplyForm";
import {
  INQUIRY_CATEGORY_OPTIONS,
  INQUIRY_STATUS_LABELS,
} from "@/lib/constants/support";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminInquiryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase } = await getAdminViewer();
  const inquiry = await getAdminInquiry(supabase, id);
  if (!inquiry) notFound();

  const category =
    INQUIRY_CATEGORY_OPTIONS.find((option) => option.value === inquiry.category)
      ?.label ?? inquiry.category;

  return (
    <div>
      <Link
        href="/admin/inquiries"
        className="text-xs font-semibold tracking-wide text-zinc-500 hover:text-zinc-950"
      >
        ← INQUIRIES
      </Link>
      <p className="mt-6 text-[10px] font-black tracking-[0.18em] text-zinc-400">
        INQUIRY
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-zinc-950">
        {category}
      </h1>
      <p className="mt-3 text-sm text-zinc-600">{inquiry.userLabel}</p>
      <p className="mt-1 text-xs text-zinc-400">
        {INQUIRY_STATUS_LABELS[inquiry.status] ?? inquiry.status} ·{" "}
        {formatAdminDateTime(inquiry.createdAt)}
      </p>
      <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-zinc-800">
        {inquiry.message}
      </p>
      {inquiry.adminReply && (
        <div className="mt-6 border-t border-zinc-200 pt-4">
          <p className="text-[10px] font-black tracking-[0.16em] text-zinc-400">
            CURRENT REPLY
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-zinc-800">
            {inquiry.adminReply}
          </p>
        </div>
      )}
      <InquiryReplyForm
        inquiryId={inquiry.id}
        initialStatus={inquiry.status}
        initialReply={inquiry.adminReply}
      />
    </div>
  );
}
