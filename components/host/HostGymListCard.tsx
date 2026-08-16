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
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-orange-300 hover:shadow-md">
      <Link href={gymHref} className="relative block">
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

      <div className="px-3 py-3">
        <Link
          href={gymHref}
          className="block truncate text-lg font-semibold text-zinc-900 hover:text-orange-700"
        >
          {gym.name}
        </Link>
        <Link
          href={gymHref}
          className="mt-0.5 block truncate text-sm text-zinc-600 hover:text-zinc-800"
        >
          {addressLine}
        </Link>
      </div>
    </article>
  );
}
