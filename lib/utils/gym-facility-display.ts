import { formatFacilityLabel } from "@/lib/utils/gym-facilities";

/** 참가자에게 중요도가 높은 시설을 먼저 보여줍니다. */
const FACILITY_PRIORITY: Record<string, number> = {
  "주차 무료": 1,
  "주차 유료": 1,
  샤워실: 2,
  탈의실: 3,
  "여자 탈의실": 4,
  "개인 사물함": 5,
  "냉·난방": 6,
  정수기: 7,
  "Wi-Fi": 8,
  차량운행: 9,
};

function getFacilitySortKey(label: string) {
  if (FACILITY_PRIORITY[label] != null) {
    return FACILITY_PRIORITY[label];
  }
  if (label.startsWith("주차")) return 1;
  return 50;
}

export function sortFacilitiesForDisplay(facilities: string[] | null | undefined) {
  return (facilities ?? [])
    .map(formatFacilityLabel)
    .sort((a, b) => {
      const diff = getFacilitySortKey(a) - getFacilitySortKey(b);
      return diff !== 0 ? diff : a.localeCompare(b, "ko");
    });
}
