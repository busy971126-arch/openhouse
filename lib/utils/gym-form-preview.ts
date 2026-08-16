import type { OptionalCategoryPhotos } from "@/components/gym/GymPhotoCategoriesInput";
import type { Gym } from "@/lib/types/database";
import type { ClassScheduleEntry } from "@/lib/utils/class-schedule";
import {
  type OptionalCategoryPhotoState,
  type GymPhotoItem,
} from "@/lib/utils/gym-photo-items";
import {
  serializeGymFacilities,
  type GymFacilityFields,
} from "@/lib/utils/gym-facilities";

export const GYM_PREVIEW_ID = "preview";

export type GymFormPreviewInput = {
  name: string;
  sport: string;
  region: string;
  address: string;
  phone: string;
  instagramUrl: string;
  homepageUrl: string;
  classSchedule: ClassScheduleEntry[];
  operatingHours: string;
  closedDays: string;
  facilityFields: GymFacilityFields;
  representativePreview: string | null;
  photoUrl: string;
  optionalPhotos: OptionalCategoryPhotos;
};

function optionalStateToPhotoItems(
  state: OptionalCategoryPhotoState,
): GymPhotoItem[] {
  const saved = state.items.map((item) => ({
    url: item.url,
    caption: item.caption,
  }));

  const pending = state.pendingPreviews.map((url, index) => ({
    url,
    caption: state.pendingCaptions[index] ?? "",
  }));

  return [...saved, ...pending];
}

/** 등록 폼 상태 → 체육관 상세 미리보기용 모델 */
export function buildGymPreviewFromForm(
  input: GymFormPreviewInput,
): Pick<
  Gym,
  | "id"
  | "name"
  | "sport"
  | "region"
  | "address"
  | "photo_url"
  | "phone"
  | "instagram_url"
  | "homepage_url"
  | "description"
  | "facilities"
  | "facility_notes"
  | "class_schedule"
  | "operating_hours"
  | "closed_days"
  | "first_visit_welcome"
  | "walk_in_visits"
  | "gi_rental"
  | "visit_details"
  | "preparation_guide"
  | "gym_tags"
  | "mat_photos"
  | "facility_photos"
  | "exterior_photos"
  | "parking_photos"
> {
  const photoUrl = input.representativePreview || input.photoUrl || null;

  return {
    id: GYM_PREVIEW_ID,
    name: input.name.trim() || "체육관 이름",
    sport: input.sport.trim() || "유도",
    region: input.region.trim() || "지역",
    address: input.address.trim() || null,
    photo_url: photoUrl,
    phone: input.phone.trim() || null,
    instagram_url: input.instagramUrl.trim() || null,
    homepage_url: input.homepageUrl.trim() || null,
    description: null,
    facilities: serializeGymFacilities(input.facilityFields),
    facility_notes: input.facilityFields.notes.trim() || null,
    class_schedule: input.classSchedule,
    operating_hours: input.operatingHours.trim() || null,
    closed_days: input.closedDays.trim() || null,
    first_visit_welcome: null,
    walk_in_visits: null,
    gi_rental: null,
    visit_details: null,
    preparation_guide: null,
    gym_tags: [],
    mat_photos: optionalStateToPhotoItems(input.optionalPhotos.mat),
    facility_photos: optionalStateToPhotoItems(input.optionalPhotos.facilities),
    exterior_photos: optionalStateToPhotoItems(input.optionalPhotos.exterior),
    parking_photos: optionalStateToPhotoItems(input.optionalPhotos.parking),
  };
}
