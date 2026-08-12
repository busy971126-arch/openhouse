import Link from "next/link";
import type { DashboardGym } from "@/lib/queries/dashboard";

type DashboardGymCardProps = {
  gym: DashboardGym;
};

export function DashboardGymCard({ gym }: DashboardGymCardProps) {
  return (
    <li className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-zinc-900">{gym.name}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {gym.sport ? `${gym.sport} · ` : ""}
            {gym.region}
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            등록된 일정 {gym.eventCount}개
            {!gym.is_public && (
              <span className="ml-2 text-zinc-500">· 비공개</span>
            )}
          </p>
        </div>
        <Link
          href={`/gym/${gym.id}/edit`}
          className="shrink-0 text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          수정
        </Link>
      </div>
    </li>
  );
}
