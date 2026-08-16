"use client";

import { useState } from "react";
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
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const sport = gym.sport ?? "유도";
  const photos = collectGymDisplayPhotos(gym);
  const activePhoto = photos[activePhotoIndex];
  const addressLine = gym.address?.trim() || gym.region;
  const gymHref = `/gym/${gym.id}`;

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
          <GymCardPhotoOverlay sport={sport} activePhoto={activePhoto} />
        )}
      </Link>

      <div className="px-3 py-3">
        <div className="flex min-w-0 items-center">
          <Link
            href={gymHref}
            className="min-w-0 truncate text-lg font-semibold text-zinc-900 hover:text-orange-700"
          >
            {gym.name}
          </Link>
          <InterestHeart
            kind="gym"
            targetId={gym.id}
            initialInterested={initialInterested}
            userId={userId}
            loginRedirect={gymHref}
            size="xs"
            className="-ml-1.5"
          />
        </div>
        <Link
          href={gymHref}
          className="mt-0.5 block truncate text-sm text-zinc-600 hover:text-zinc-800"
        >
          {addressLine}
        </Link>
        {recommendReason ? (
          <p className="mt-2 text-xs text-zinc-500">{recommendReason}</p>
        ) : null}
      </div>
    </article>
  );
}
