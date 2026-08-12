/** 체육관 시설 체크박스 (주차 제외, 중요도 순) */
export const GYM_FACILITY_OPTIONS = [
  { value: "샤워실", label: "샤워실" },
  { value: "탈의실", label: "남자 탈의실" },
  { value: "여자 탈의실", label: "여자 탈의실" },
  { value: "개인 사물함", label: "락커/사물함" },
  { value: "냉·난방", label: "에어컨/난방" },
  { value: "정수기", label: "정수기" },
  { value: "Wi-Fi", label: "와이파이" },
  { value: "차량운행", label: "차량운행" },
] as const;

export const GYM_PARKING_OPTIONS = [
  { value: "free", label: "무료" },
  { value: "paid", label: "유료" },
] as const;

export type GymParkingType = (typeof GYM_PARKING_OPTIONS)[number]["value"];

export const GYM_VISIBILITY_OPTIONS = [
  { value: "public", label: "공개" },
  { value: "private", label: "비공개" },
] as const;

export const GYM_FACILITY_VALUES = GYM_FACILITY_OPTIONS.map(
  (option) => option.value,
);

/** 시설 정보 아이콘 (이벤트 상세 등) */
export const FACILITY_ICONS: Record<string, string> = {
  샤워실: "🚿",
  탈의실: "👕",
  "여자 탈의실": "🚺",
  "개인 사물함": "🔐",
  "냉·난방": "❄",
  정수기: "💧",
  "Wi-Fi": "📶",
  차량운행: "🚗",
  "주차 무료": "🅿",
  "주차 유료": "🅿",
};

export function getFacilityIcon(label: string): string {
  if (FACILITY_ICONS[label]) return FACILITY_ICONS[label];
  if (label.startsWith("주차")) return "🅿";
  return "✓";
}
