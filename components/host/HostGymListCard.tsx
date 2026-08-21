"use client";

import { useState } from "react";
import Link from "next/link";
import { GymPhotoCarousel } from "@/components/gym/GymPhotoCarousel";
import { GymCardPhotoOverlay } from "@/components/gym/GymCardPhotoOverlay";
import type { Gym } from "@/lib/types/database";
import { collectGymDisplayPhotos } from "@/lib/utils/gym-display-photos";

type HostGymListCardProps = {
  gym: Gym;
};

export function HostGymListCard({ gym }: HostGymListCardProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const sport = gym.sport ?? "유도";
  const photos = collectGymDisplayPhotos(gym);
  const activePhoto = photos[activePhotoIndex];
  const addressLine = gym.address?.trim() || gym.region;
  const gymHref = `/host/gyms/${gym.id}`;

  return (
    <article className="border-b border-zinc-300 pb-5">
      <Link href={gymHref} className="relative block overflow-hidden bg-zinc-100">
        <GymPhotoCarousel
          photos={photos}
          alt={gym.name}
          aspect="compact"
          showPhotoLabels={false}
          dotPosition="raised"
          onActiveIndexChange={setActivePhotoIndex}
        />

        {photos.length > 0 && (
          <GymCardPhotoOverlay
            sport={sport}
            activePhoto={activePhoto}
            privateBadge={!gym.is_public}
          />
        )}
      </Link>

      <Link href={gymHref} className="group mt-3 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-black tracking-[-0.02em] text-zinc-950 group-hover:text-orange-700">
            {gym.name}
          </p>
          <p className="mt-1 truncate text-sm text-zinc-500">{addressLine}</p>
        </div>
        <span className="shrink-0 pb-0.5 text-sm text-zinc-400 transition group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </article>
  );
}
