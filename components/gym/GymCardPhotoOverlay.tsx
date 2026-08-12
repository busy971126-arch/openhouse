import type { GymDisplayPhoto } from "@/lib/utils/gym-display-photos";
import { getSportEmoji } from "@/lib/constants/profile";
import {
  OverlayBadgePrimary,
  OverlayBadgeSecondary,
  OverlayPhotoLabel,
  PhotoBottomGradient,
} from "@/components/ui/OverlayBadge";

type GymCardPhotoOverlayProps = {
  name: string;
  address: string;
  sport: string;
  activePhoto: GymDisplayPhoto | undefined;
  privateBadge?: boolean;
};

function isRepresentativePhoto(photo: GymDisplayPhoto | undefined): boolean {
  return photo != null && photo.showFacilityLabel === false;
}

export function GymCardPhotoOverlay({
  name,
  address,
  sport,
  activePhoto,
  privateBadge = false,
}: GymCardPhotoOverlayProps) {
  const showRepresentativeInfo = isRepresentativePhoto(activePhoto);
  const showFacilityLabel =
    !showRepresentativeInfo &&
    activePhoto?.showFacilityLabel !== false &&
    !!activePhoto?.label;

  return (
    <>
      <PhotoBottomGradient />

      <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap gap-1.5">
        <OverlayBadgePrimary>
          {getSportEmoji(sport)} {sport}
        </OverlayBadgePrimary>
        {privateBadge && (
          <OverlayBadgeSecondary className="bg-zinc-900/70 text-white">
            비공개
          </OverlayBadgeSecondary>
        )}
      </div>

      {showRepresentativeInfo && (
        <div className="pointer-events-none absolute bottom-4 left-3 z-20 max-w-[80%] text-white">
          <p className="truncate text-lg font-bold leading-tight drop-shadow-md">
            {name}
          </p>
          <p className="mt-0.5 truncate text-xs text-white/85 drop-shadow-sm">
            {address}
          </p>
        </div>
      )}

      {showFacilityLabel && activePhoto?.label && (
        <span className="pointer-events-none absolute bottom-5 left-3 z-20">
          <OverlayPhotoLabel>{activePhoto.label}</OverlayPhotoLabel>
        </span>
      )}
    </>
  );
}

export function GymCardPhotoFallback({
  name,
  address,
}: {
  name: string;
  address: string;
}) {
  return (
    <div className="p-3">
      <p className="truncate text-lg font-semibold text-zinc-900">{name}</p>
      <p className="mt-1 truncate text-sm text-zinc-600">{address}</p>
    </div>
  );
}
