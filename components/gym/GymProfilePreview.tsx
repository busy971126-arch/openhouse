"use client";

import { useState } from "react";
import { GymPhotoCarousel } from "@/components/gym/GymPhotoCarousel";
import { GymCardPhotoOverlay } from "@/components/gym/GymCardPhotoOverlay";
import { collectGymPreviewPhotos } from "@/lib/utils/gym-display-photos";
import type { OptionalCategoryPhotos } from "@/components/gym/GymPhotoCategoriesInput";

type GymProfilePreviewProps = {
  name: string;
  sport: string;
  address: string;
  representativePreview: string | null;
  optional: OptionalCategoryPhotos;
  /** 상위 패널에 포함될 때 바깥 래퍼 생략 */
  embedded?: boolean;
};

export function GymProfilePreview({
  name,
  sport,
  address,
  representativePreview,
  optional,
  embedded = false,
}: GymProfilePreviewProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const photos = collectGymPreviewPhotos(representativePreview, optional);
  const displayName = name.trim() || "체육관 이름";
  const displaySport = sport.trim() || "유도";
  const displayAddress = address.trim() || "주소";
  const activePhoto = photos[activePhotoIndex];

  const card = (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="relative">
        <GymPhotoCarousel
          photos={photos}
          alt={displayName}
          aspect="compact"
          showPhotoLabels={false}
          dotPosition="raised"
          onActiveIndexChange={setActivePhotoIndex}
        />

        {photos.length > 0 && (
          <GymCardPhotoOverlay sport={displaySport} activePhoto={activePhoto} />
        )}
      </div>

      <div className="px-3 py-3">
        <p className="truncate text-lg font-semibold text-zinc-900">{displayName}</p>
        <p className="mt-0.5 truncate text-sm text-zinc-600">{displayAddress}</p>
      </div>
    </article>
  );

  if (embedded) {
    return (
      <div>
        {card}
        {photos.length === 0 && (
          <p className="mt-2 text-xs text-orange-800">
            대표 단체사진을 등록하면 미리보기가 채워집니다.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-xl border border-orange-200 bg-orange-50/40 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900">탐색 화면 미리보기</p>
        <span className="text-xs text-zinc-500">예정 참가자에게 이렇게 보여요</span>
      </div>

      {card}

      {photos.length === 0 && (
        <p className="mt-2 text-xs text-orange-800">
          대표 단체사진을 등록하면 미리보기가 채워집니다.
        </p>
      )}
    </div>
  );
}
