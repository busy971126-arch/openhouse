import {
  GYM_OPTIONAL_PHOTO_CATEGORIES,
  GYM_REPRESENTATIVE_PHOTO,
  type GymOptionalPhotoCategory,
} from "@/lib/constants/gym-photos";
import {
  getOptionalPhotoDisplayLabel,
  isValidPhotoUrl,
  parseGymPhotoItems,
  type GymPhotoItem,
  type OptionalCategoryPhotoState,
} from "@/lib/utils/gym-photo-items";

export type GymDisplayPhoto = {
  url: string;
  label: string;
  /** false면 대표 사진 등 — 시설 라벨을 숨깁니다 */
  showFacilityLabel?: boolean;
};

type GymPhotoSource = {
  photo_url: string | null;
  mat_photos?: unknown;
  facility_photos?: unknown;
  exterior_photos?: unknown;
  parking_photos?: unknown;
};

const PHOTO_GETTERS: Record<
  GymOptionalPhotoCategory,
  (gym: GymPhotoSource) => GymPhotoItem[]
> = {
  mat: (gym) => parsePhotoColumn(gym.mat_photos),
  facilities: (gym) => parsePhotoColumn(gym.facility_photos),
  exterior: (gym) => parsePhotoColumn(gym.exterior_photos),
  parking: (gym) => parsePhotoColumn(gym.parking_photos),
};

function parsePhotoColumn(value: unknown): GymPhotoItem[] {
  return parseGymPhotoItems(value);
}

function pushPhoto(
  photos: GymDisplayPhoto[],
  seen: Set<string>,
  url: string,
  label: string,
  showFacilityLabel = true,
) {
  if (!isValidPhotoUrl(url) || seen.has(url)) return;
  seen.add(url);
  photos.push({ url, label, showFacilityLabel });
}

/** 체육관 사진을 대표 → 카테고리 순으로 모읍니다. */
export function collectGymDisplayPhotos(gym: GymPhotoSource): GymDisplayPhoto[] {
  const photos: GymDisplayPhoto[] = [];
  const seen = new Set<string>();

  if (gym.photo_url && isValidPhotoUrl(gym.photo_url)) {
    pushPhoto(
      photos,
      seen,
      gym.photo_url,
      GYM_REPRESENTATIVE_PHOTO.title,
      false,
    );
  }

  for (const category of GYM_OPTIONAL_PHOTO_CATEGORIES) {
    const items =
      category.id === "mat"
        ? [
            ...PHOTO_GETTERS.mat(gym),
            ...PHOTO_GETTERS.facilities(gym),
          ]
        : PHOTO_GETTERS[category.id](gym);

    for (const item of items) {
      pushPhoto(
        photos,
        seen,
        item.url,
        getOptionalPhotoDisplayLabel(item.caption, category.title),
        true,
      );
    }
  }

  return photos;
}

/** 등록 폼 상태에서 탐색 카드 미리보기용 사진 목록 */
export function collectGymPreviewPhotos(
  representativePreview: string | null,
  optional: Record<GymOptionalPhotoCategory, OptionalCategoryPhotoState>,
): GymDisplayPhoto[] {
  const photos: GymDisplayPhoto[] = [];
  const seen = new Set<string>();

  if (representativePreview) {
    pushPhoto(
      photos,
      seen,
      representativePreview,
      GYM_REPRESENTATIVE_PHOTO.title,
      false,
    );
  }

  for (const category of GYM_OPTIONAL_PHOTO_CATEGORIES) {
    const bucket = optional[category.id];
    const legacyFacilities =
      category.id === "mat" ? optional.facilities : null;

    const allItems =
      category.id === "mat"
        ? [...bucket.items, ...(legacyFacilities?.items ?? [])]
        : bucket.items;
    const allPendingPreviews =
      category.id === "mat"
        ? [
            ...bucket.pendingPreviews,
            ...(legacyFacilities?.pendingPreviews ?? []),
          ]
        : bucket.pendingPreviews;
    const allPendingCaptions =
      category.id === "mat"
        ? [
            ...bucket.pendingCaptions,
            ...(legacyFacilities?.pendingCaptions ?? []),
          ]
        : bucket.pendingCaptions;

    allItems.forEach((item) => {
      pushPhoto(
        photos,
        seen,
        item.url,
        getOptionalPhotoDisplayLabel(item.caption, category.title),
        true,
      );
    });

    allPendingPreviews.forEach((preview, index) => {
      pushPhoto(
        photos,
        seen,
        preview,
        getOptionalPhotoDisplayLabel(
          allPendingCaptions[index] ?? "",
          category.title,
        ),
        true,
      );
    });
  }

  return photos;
}
