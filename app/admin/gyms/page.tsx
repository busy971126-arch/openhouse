import Link from "next/link";
import { getAdminViewer } from "@/lib/admin/auth";
import { getAdminGyms } from "@/lib/queries/admin";
import { formatAdminDate } from "@/lib/utils/admin";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminGymsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const { supabase } = await getAdminViewer();
  const items = await getAdminGyms(supabase, query);

  return (
    <div>
      <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">
        GYMS
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-zinc-950">
        체육관
      </h1>
      <form className="mt-6 border-b border-zinc-400 pb-2">
        <label className="sr-only" htmlFor="admin-gym-search">
          체육관 검색
        </label>
        <input
          id="admin-gym-search"
          name="q"
          defaultValue={query}
          placeholder="이름, 지역, 종목"
          className="w-full border-0 bg-transparent px-0 py-1 text-sm text-zinc-950 outline-none"
        />
      </form>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">검색된 체육관이 없습니다.</p>
      ) : (
        <ul className="mt-4">
          {items.map((item) => (
            <li key={item.id} className="border-b border-zinc-200 py-4">
              <div className="flex items-baseline justify-between gap-3">
                {item.isPublic ? (
                  <Link
                    href={`/gym/${item.id}`}
                    className="text-sm font-semibold text-zinc-950 underline underline-offset-4"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold text-zinc-950">{item.name}</p>
                )}
                <span className="text-xs text-zinc-500">
                  {item.isPublic ? "공개" : "비공개"}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                {item.sport} · {item.region}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                {item.ownerLabel} · 예정 {item.upcomingEventCount}
              </p>
              <time className="mt-2 block text-xs text-zinc-400">
                {formatAdminDate(item.createdAt.slice(0, 10))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
