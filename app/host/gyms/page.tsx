import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HostGymListCard } from "@/components/host/HostGymListCard";
import { getHostGymsWithDetails } from "@/lib/queries/host-gyms";

export default async function HostGymsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/host/gyms");

  const gyms = await getHostGymsWithDetails(user.id);

  return (
    <div>
      <header className="mb-8 border-b border-zinc-300 pb-5">
        <p className="text-[10px] font-black tracking-[0.16em] text-orange-600">
          HOST
        </p>
        <h1 className="mt-2 text-[28px] font-black leading-none tracking-[-0.035em] text-zinc-950">
          내 체육관
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          체육관을 선택해 이벤트와 참가자를 관리합니다.
        </p>
      </header>

      {gyms.length === 0 ? (
        <section className="border-y border-zinc-300 py-6">
          <p className="text-sm leading-6 text-zinc-600">
            아직 등록한 체육관이 없습니다.
          </p>
          <Link
            href="/gym/new"
            className="mt-4 inline-block text-sm font-bold text-orange-600 hover:text-orange-700"
          >
            첫 체육관 등록하기 →
          </Link>
        </section>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            {gyms.map((gym) => (
              <HostGymListCard key={gym.id} gym={gym} />
            ))}
          </div>

          <Link
            href="/gym/new"
            className="mt-8 flex items-center justify-between border-y border-zinc-300 py-4 text-sm font-bold text-zinc-900 hover:text-orange-700"
          >
            <span>체육관 추가</span>
            <span>＋</span>
          </Link>
        </>
      )}
    </div>
  );
}
