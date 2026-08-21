"use client";

import Link from "next/link";
import { GymPhotoCarousel } from "@/components/gym/GymPhotoCarousel";
import { GymCardPhotoOverlay } from "@/components/gym/GymCardPhotoOverlay";
import { InterestHeart } from "@/components/interest/InterestHeart";
import type { GymWithEventCount } from "@/lib/queries/gyms";
import { collectGymDisplayPhotos } from "@/lib/utils/gym-display-photos";

type GymListCardProps = {
  gym: GymWithEventCount;
  recommendReason?: string;
  userId?: string | null;
  initialInterested?: boolean;
};

export function GymListCard({
  gym,
  recommendReason,
  userId = null,
  initialInterested = false,
}: GymListCardProps) {
  const sport = gym.sport ?? "유도";
  const photos = collectGymDisplayPhotos(gym);
  const addressLine = gym.address?.trim() || gym.region;
  const gymHref = `/gym/${gym.id}`;

  return (
    <article className="overflow-hidden border-b border-zinc-300 pb-5 last:border-b-0">
      <Link href={gymHref} className="relative block overflow-hidden bg-zinc-100">
        <GymPhotoCarousel
          photos={photos}
          alt={gym.name}
          aspect="compact"
          showPhotoLabels
          dotPosition="raised"
        />

        {photos.length > 0 && (
          <GymCardPhotoOverlay sport={sport} activePhoto={undefined} />
        )}
      </Link>

      <div className="pt-3.5">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">{sport}</p>
            <Link
              href={gymHref}
              className="mt-1 block truncate text-[19px] font-black tracking-[-0.025em] text-zinc-950 hover:text-orange-700"
            >
              {gym.name}
            </Link>
          </div>
          <InterestHeart
            kind="gym"
            targetId={gym.id}
            initialInterested={initialInterested}
            userId={userId}
            loginRedirect={gymHref}
            size="xs"
          />
        </div>
        <Link
          href={gymHref}
          className="mt-1.5 block truncate text-sm text-zinc-600 hover:text-zinc-800"
        >
          {addressLine}
        </Link>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span>
            {gym.upcomingEventCount > 0
              ? `예정 이벤트 ${gym.upcomingEventCount}개`
              : "예정 이벤트 없음"}
          </span>
          {recommendReason ? <span>{recommendReason}</span> : null}
        </div>
      </div>
    </article>
  );
}
