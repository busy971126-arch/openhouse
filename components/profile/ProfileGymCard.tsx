import Link from "next/link";
import type { Gym } from "@/lib/types/database";

type ProfileGymCardProps = {
  gym: Gym;
};

export function ProfileGymCard({ gym }: ProfileGymCardProps) {
  return (
    <Link
      href={`/host/gyms/${gym.id}`}
      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-orange-300 hover:bg-orange-50/30"
    >
      {gym.photo_url ? (
        <img
          src={gym.photo_url}
          alt={gym.name}
          className="size-16 shrink-0 rounded-lg border border-zinc-200 object-cover"
        />
      ) : (
        <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-2xl">
          🏢
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-zinc-900">{gym.name}</p>
          {!gym.is_public && (
            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              비공개
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-zinc-600">
          {gym.sport ?? "유도"} · {gym.region}
        </p>
        {gym.address && (
          <p className="mt-1 truncate text-sm text-zinc-500">{gym.address}</p>
        )}
      </div>

      <span className="shrink-0 text-zinc-400" aria-hidden>
        ›
      </span>
    </Link>
  );
}
