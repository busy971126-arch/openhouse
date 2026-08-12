export type GymOptionalPhotoCategory =
  | "mat"
  | "facilities"
  | "exterior"
  | "parking";

export const GYM_REPRESENTATIVE_PHOTO = {
  id: "representative" as const,
  order: 1,
  title: "대표 단체사진",
  required: true,
  hint: "참가자가 가장 먼저 보는 사진입니다. 체육관의 분위기가 잘 보이는 단체사진을 등록해 주세요.",
};

export const GYM_OPTIONAL_PHOTO_CATEGORIES: {
  id: GymOptionalPhotoCategory;
  order: number;
  title: string;
  hint: string;
  captionPlaceholder?: string;
}[] = [
  {
    id: "mat",
    order: 2,
    title: "운동 공간 및 부대시설",
    hint: "운동 공간 및 부대시설 사진을 등록해 주세요.\n\n사진마다 시설명을 입력해 주세요.\n(예: 매트, 샤워실, 탈의실)",
    captionPlaceholder: "예: 매트, 샤워실, 탈의실",
  },
  {
    id: "exterior",
    order: 3,
    title: "체육관 외관",
    hint: "외관 사진을 등록해 주세요.",
    captionPlaceholder: "예: 정문, 간판",
  },
  {
    id: "parking",
    order: 4,
    title: "주차장",
    hint: "주차 공간이 보이는 사진을 등록해 주세요.",
    captionPlaceholder: "예: 지하 주차장, 2시간 무료",
  },
];

export function formatPhotoCategoryStatus(
  count: number,
  required = false,
): string {
  if (count <= 0) {
    return required ? "필수 · 미등록" : "미등록";
  }
  if (required) {
    return "✅ 등록 완료";
  }
  return `📷 사진 ${count}장`;
}

export const GYM_PHOTO_DB_COLUMNS: Record<
  GymOptionalPhotoCategory,
  "mat_photos" | "facility_photos" | "exterior_photos" | "parking_photos"
> = {
  mat: "mat_photos",
  facilities: "facility_photos",
  exterior: "exterior_photos",
  parking: "parking_photos",
};
