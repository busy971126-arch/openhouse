import Link from "next/link";
import { getAdminViewer } from "@/lib/admin/auth";
import { getAdminInquiries } from "@/lib/queries/admin";
import { formatAdminDateTime } from "@/lib/utils/admin";
import { INQUIRY_CATEGORY_OPTIONS, INQUIRY_STATUS_LABELS } from "@/lib/constants/support";

export default async function AdminInquiriesPage() {
  const { supabase } = await getAdminViewer();
  const items = await getAdminInquiries(supabase);

  return (
    <div>
      <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">
        INQUIRIES
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-zinc-950">
        문의
      </h1>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">접수된 문의가 없습니다.</p>
      ) : (
        <ul className="mt-6">
          {items.map((item) => {
            const category =
              INQUIRY_CATEGORY_OPTIONS.find((option) => option.value === item.category)
                ?.label ?? item.category;

            return (
              <li key={item.id} className="border-b border-zinc-200 py-4">
                <Link href={`/admin/inquiries/${item.id}`} className="block">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-950">{category}</p>
                    <span className="text-xs text-zinc-500">
                      {INQUIRY_STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{item.userLabel}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-700">
                    {item.message}
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
