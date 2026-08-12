"use client";

import { useState } from "react";
import Link from "next/link";
import { GymPhotoCarousel } from "@/components/gym/GymPhotoCarousel";
import {
  GymCardPhotoFallback,
  GymCardPhotoOverlay,
} from "@/components/gym/GymCardPhotoOverlay";
import type { GymWithEventCount } from "@/lib/queries/gyms";
import { collectGymDisplayPhotos } from "@/lib/utils/gym-display-photos";

type GymListCardProps = {
  gym: GymWithEventCount;
};

export function GymListCard({ gym }: GymListCardProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const sport = gym.sport ?? "유도";
  const photos = collectGymDisplayPhotos(gym);
  const activePhoto = photos[activePhotoIndex];
  const addressLine = gym.address?.trim() || gym.region;

  return (
    <Link
      href={`/gym/${gym.id}`}
      className="block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-orange-300 hover:shadow-md"
    >
      <div className="relative">
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
            name={gym.name}
            address={addressLine}
            sport={sport}
            activePhoto={activePhoto}
          />
        )}
      </div>

      {photos.length === 0 && (
        <GymCardPhotoFallback name={gym.name} address={addressLine} />
      )}
    </Link>
  );
}
