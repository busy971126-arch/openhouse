import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HostGymHubLink } from "@/components/host/HostGymHubLink";
import { getHostGymById } from "@/lib/queries/host-gyms";
import { formatHostIdentitySubtitle } from "@/lib/constants/gym-representative";

type PageProps = {
  params: Promise<{ gymId: string }>;
};

export default async function HostGymHubPage({ params }: PageProps) {
  const { gymId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/host/gyms/${gymId}`)}`);

  const gym = await getHostGymById(user.id, gymId);
  if (!gym) notFound();

  const hostSubtitle = formatHostIdentitySubtitle(
    gym.representative_role,
    gym.representative_role_custom,
  );

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/host/gyms"
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        ← 내 체육관
      </Link>

      <div className="flex gap-4">
        {gym.photo_url ? (
          <img
            src={gym.photo_url}
            alt={gym.name}
            className="size-20 shrink-0 rounded-xl border border-zinc-200 object-cover"
          />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-3xl">
            🏢
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-zinc-900">{gym.name}</h1>
          {gym.representative_name && (
            <p className="mt-1 text-sm font-medium text-zinc-800">
              {gym.representative_name}
            </p>
          )}
          {hostSubtitle && (
            <p className="mt-0.5 text-sm text-orange-600">{hostSubtitle}</p>
          )}
          <p className="mt-1 text-sm text-zinc-600">
            {gym.sport ?? "유도"} · {gym.region}
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        <HostGymHubLink
          href={`/gym/${gym.id}/edit`}
          icon="📋"
          label="체육관 정보 수정"
          description="사진, 시설, 연락처"
        />
        <HostGymHubLink
          href={`/host/gyms/${gym.id}/events`}
          icon="📅"
          label="이벤트 관리"
          description="일정 등록 및 수정"
        />
        <HostGymHubLink
          href={`/host/participants?gym=${gym.id}`}
          icon="👥"
          label="참가자 관리"
          description="신청 확인 및 승인"
        />
      </nav>
    </div>
  );
}
