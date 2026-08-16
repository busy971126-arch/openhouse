import type { GymDisplayPhoto } from "@/lib/utils/gym-display-photos";
import { getSportEmoji } from "@/lib/constants/profile";
import {
  OverlayBadgePrimary,
  OverlayBadgeSecondary,
  OverlayPhotoLabel,
  PhotoBottomGradient,
} from "@/components/ui/OverlayBadge";

type GymCardPhotoOverlayProps = {
  sport: string;
  activePhoto: GymDisplayPhoto | undefined;
  privateBadge?: boolean;
};

export function GymCardPhotoOverlay({
  sport,
  activePhoto,
  privateBadge = false,
}: GymCardPhotoOverlayProps) {
  const showFacilityLabel =
    activePhoto?.showFacilityLabel !== false && !!activePhoto?.label;

  return (
    <>
      {showFacilityLabel && <PhotoBottomGradient />}

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

      {showFacilityLabel && activePhoto?.label && (
        <span className="pointer-events-none absolute bottom-5 left-3 z-20">
          <OverlayPhotoLabel>{activePhoto.label}</OverlayPhotoLabel>
        </span>
      )}
    </>
  );
}
