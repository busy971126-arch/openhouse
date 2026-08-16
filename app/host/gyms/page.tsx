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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">내 체육관</h1>
        <p className="mt-1 text-sm text-zinc-600">
          운영 중인 체육관을 선택해 관리하세요.
        </p>
      </div>

      {gyms.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
          <p className="text-sm text-zinc-600">
            등록된 체육관이 없습니다. 체육관을 추가하면 이벤트와 예정 참가자를
            관리할 수 있습니다.
          </p>
          <Link
            href="/gym/new"
            className="mt-4 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            + 체육관 추가
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {gyms.map((gym) => (
              <HostGymListCard key={gym.id} gym={gym} />
            ))}
          </div>

          <Link
            href="/gym/new"
            className="flex items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-4 text-sm font-medium text-orange-600 hover:border-orange-300 hover:bg-orange-50"
          >
            + 체육관 추가
          </Link>
        </>
      )}
    </div>
  );
}
