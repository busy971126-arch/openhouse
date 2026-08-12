import type { OptionalCategoryPhotos } from "@/components/gym/GymPhotoCategoriesInput";
import type { ClassScheduleEntry } from "@/lib/utils/class-schedule";
import type { GymFacilityFields } from "@/lib/utils/gym-facilities";

export type GymProfileCompletionInput = {
  facilityFields: GymFacilityFields;
  operatingHours: string;
  classSchedule: ClassScheduleEntry[];
  closedDays: string;
  phone: string;
  instagramUrl: string;
  homepageUrl: string;
  optionalPhotos: OptionalCategoryPhotos;
};

export type GymProfileCompletionItem = {
  id: string;
  label: string;
  done: boolean;
};

export type GymProfileCompletion = {
  completed: number;
  total: number;
  percent: number;
  items: GymProfileCompletionItem[];
  missing: string[];
};

function hasOptionalPhotos(optionalPhotos: OptionalCategoryPhotos) {
  return (
    optionalPhotos.mat.items.length > 0 ||
    optionalPhotos.mat.pendingPreviews.length > 0 ||
    optionalPhotos.exterior.items.length > 0 ||
    optionalPhotos.exterior.pendingPreviews.length > 0 ||
    optionalPhotos.parking.items.length > 0 ||
    optionalPhotos.parking.pendingPreviews.length > 0
  );
}

/** 선택 항목 기준 프로필 완성도 (필수 항목 제외) */
export function getGymProfileCompletion(
  input: GymProfileCompletionInput,
): GymProfileCompletion {
  const items: GymProfileCompletionItem[] = [
    {
      id: "photos",
      label: "운동·시설 사진",
      done: hasOptionalPhotos(input.optionalPhotos),
    },
    {
      id: "operating",
      label: "운영 시간·시간표",
      done:
        input.operatingHours.trim().length > 0 ||
        input.classSchedule.length > 0 ||
        input.closedDays.trim().length > 0,
    },
    {
      id: "facilities",
      label: "시설 정보",
      done:
        input.facilityFields.selected.length > 0 ||
        input.facilityFields.parkingType !== null ||
        input.facilityFields.notes.trim().length > 0,
    },
    {
      id: "contact",
      label: "공개 연락처",
      done:
        input.phone.trim().length > 0 ||
        input.instagramUrl.trim().length > 0 ||
        input.homepageUrl.trim().length > 0,
    },
  ];

  const completed = items.filter((item) => item.done).length;
  const total = items.length;
  const missing = items.filter((item) => !item.done).map((item) => item.label);

  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    items,
    missing,
  };
}
