import Link from "next/link";
import { getAdminViewer } from "@/lib/admin/auth";
import { getAdminApplications } from "@/lib/queries/admin";
import {
  APPLICATION_ADMIN_STATUSES,
  formatAdminDate,
  formatAdminDateTime,
  formatApplicationAdminStatus,
  parseApplicationAdminStatus,
} from "@/lib/utils/admin";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function AdminApplicationsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const status = parseApplicationAdminStatus(params.status);
  const { supabase } = await getAdminViewer();
  const items = await getAdminApplications(supabase, { search: query, status });

  return (
    <div>
      <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">
        APPLICATIONS
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-zinc-950">
        신청
      </h1>

      <form className="mt-6 flex flex-col gap-3">
        <input
          name="q"
          defaultValue={query}
          placeholder="참가자, 이벤트명"
          className="w-full border-0 border-b border-zinc-400 bg-transparent px-0 py-2 text-sm text-zinc-950 outline-none"
        />
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <div className="flex flex-wrap gap-4 text-[11px] font-bold tracking-[0.12em]">
          <Link
            href={
              query
                ? `/admin/applications?q=${encodeURIComponent(query)}`
                : "/admin/applications"
            }
            className={!status ? "text-zinc-950" : "text-zinc-400"}
          >
            ALL
          </Link>
          {APPLICATION_ADMIN_STATUSES.map((value) => (
            <Link
              key={value}
              href={`/admin/applications?status=${value}${
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
        <p className="mt-8 text-sm text-zinc-500">검색된 신청이 없습니다.</p>
      ) : (
        <ul className="mt-6">
          {items.map((item) => (
            <li key={item.id} className="border-b border-zinc-200 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <Link
                  href={`/admin/applications/${item.id}`}
                  className="text-sm font-semibold text-zinc-950 underline underline-offset-4"
                >
                  {item.participantLabel}
                </Link>
                <span className="text-xs text-zinc-500">
                  {formatApplicationAdminStatus(item.status)}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                {item.eventTitle} · {formatAdminDate(item.eventDate)}
              </p>
              <p className="mt-1 text-sm text-zinc-500">{item.gymName}</p>
              <time className="mt-2 block text-xs text-zinc-400">
                {formatAdminDateTime(item.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
