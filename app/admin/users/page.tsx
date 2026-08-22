import { getAdminViewer } from "@/lib/admin/auth";
import { getAdminUsers } from "@/lib/queries/admin";
import { formatAdminDate, formatAdminUserLabel } from "@/lib/utils/admin";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const { supabase } = await getAdminViewer();
  const items = await getAdminUsers(supabase, query);

  return (
    <div>
      <p className="text-[10px] font-black tracking-[0.18em] text-zinc-400">
        USERS
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-zinc-950">
        사용자
      </h1>
      <form className="mt-6 border-b border-zinc-400 pb-2">
        <label className="sr-only" htmlFor="admin-user-search">
          사용자 검색
        </label>
        <input
          id="admin-user-search"
          name="q"
          defaultValue={query}
          placeholder="닉네임, 표시 이름"
          className="w-full border-0 bg-transparent px-0 py-1 text-sm text-zinc-950 outline-none"
        />
      </form>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500">검색된 사용자가 없습니다.</p>
      ) : (
        <ul className="mt-4">
          {items.map((item) => (
            <li key={item.id} className="border-b border-zinc-200 py-4">
              <p className="text-sm font-semibold text-zinc-950">
                {formatAdminUserLabel(item.nickname, item.displayName)}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                {item.isOperator ? "운영자" : "참가자"} · 신청 {item.applicationCount}
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
