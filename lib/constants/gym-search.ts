export type GymSort = "recommended" | "distance" | "events" | "recent" | "name";

export const GYM_SORT_OPTIONS: { value: GymSort; label: string }[] = [
  { value: "recommended", label: "추천순" },
  { value: "distance", label: "가까운 순" },
  { value: "events", label: "예정 이벤트 많은 순" },
  { value: "recent", label: "최신 등록순" },
  { value: "name", label: "이름순" },
];

export const GYM_QUICK_OPTIONS = [
  { value: "nearby", label: "📍 내 주변" },
  { value: "beginner", label: "🟢 초보 환영" },
  { value: "has_events", label: "📅 예정 이벤트" },
] as const;

export type GymQuickOption = (typeof GYM_QUICK_OPTIONS)[number]["value"];

/** Bottom Sheet 시설 필터 (체크박스) */
export const GYM_SHEET_FACILITY_OPTIONS = [
  { value: "parking", label: "주차 가능" },
  { value: "parking_free", label: "무료 주차" },
  { value: "샤워실", label: "샤워실" },
  { value: "탈의실", label: "남자 탈의실" },
  { value: "여자 탈의실", label: "여자 탈의실" },
  { value: "정수기", label: "정수기" },
  { value: "냉·난방", label: "냉·난방" },
] as const;

export type GymSheetFacility =
  (typeof GYM_SHEET_FACILITY_OPTIONS)[number]["value"];

export const GYM_SHEET_OPERATION_OPTIONS = [
  { value: "beginner", label: "초보 환영" },
  { value: "has_events", label: "예정 이벤트 있음" },
] as const;

export type GymSheetOperation =
  (typeof GYM_SHEET_OPERATION_OPTIONS)[number]["value"];

export const MAX_GYM_CARD_FACILITY_BADGES = 3;
