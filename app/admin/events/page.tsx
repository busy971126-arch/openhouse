import Link from "next/link";
import { getAdminViewer } from "@/lib/admin/auth";
import { getAdminEvents } from "@/lib/queries/admin";
import {
  EVENT_ADMIN_STATUSES,
  formatAdminDate,
  formatEventAdminStatus,
  parseEventAdminStatus,
} from "@/lib/utils/admin";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function AdminEventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const status = parseEventAdminStatus(params.status);
  const { supabase } = await getAdminViewer();
  const items = await getAdminEvents(supabase, { search: query, status });

  return (
    <div>
      <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">
        EVENTS
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-zinc-950">
        이벤트
      </h1>

      <form className="mt-6 flex flex-col gap-3">
        <input
          name="q"
          defaultValue={query}
          placeholder="이벤트명"
          className="w-full border-0 border-b border-zinc-400 bg-transparent px-0 py-2 text-sm text-zinc-950 outline-none"
        />
        <div className="flex flex-wrap gap-4 text-[11px] font-bold tracking-[0.12em]">
          <Link
            href={query ? `/admin/events?q=${encodeURIComponent(query)}` : "/admin/events"}
            className={!status ? "text-zinc-950" : "text-zinc-400"}
          >
            ALL
          </Link>
          {EVENT_ADMIN_STATUSES.map((value) => (
            <Link
              key={value}
              href={`/admin/events?status=${value}${
                query ? `&q=${encodeURIComponent(query)}` : ""
              }`}
              className={status === value ? "text-zinc-950" : "text-zinc-400"}
            >
              {value.toUpperCase()}
            </Link>
          ))}
        </div>
      </form>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">검색된 이벤트가 없습니다.</p>
      ) : (
        <ul className="mt-6">
          {items.map((item) => (
            <li key={item.id} className="border-b border-zinc-200 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <Link
                  href={`/events/${item.id}`}
                  className="text-sm font-semibold text-zinc-950 underline underline-offset-4"
                >
                  {item.title}
                </Link>
                <span className="text-xs text-zinc-500">
                  {formatEventAdminStatus(item.status)}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                {item.gymName} · {formatAdminDate(item.eventDate)}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {item.hostLabel} · 신청 {item.applicationCount}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
