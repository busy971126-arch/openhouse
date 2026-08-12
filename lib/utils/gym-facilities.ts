import {
  GYM_FACILITY_VALUES,
  type GymParkingType,
} from "@/lib/constants/gym";

export type GymFacilityFields = {
  selected: string[];
  parkingType: GymParkingType | null;
  notes: string;
};

const PARKING_PREFIX = "주차:";

export function formatFacilityLabel(item: string): string {
  if (item.startsWith(PARKING_PREFIX)) {
    return `주차 ${item.replace(PARKING_PREFIX, "")}`;
  }
  return item;
}

const LEGACY_PARKING_FREE = new Set(["무료 주차", "주차:무료"]);
const LEGACY_PARKING_PAID = new Set(["주차:유료"]);

function parkingLabel(type: GymParkingType): string {
  return type === "free" ? "무료" : "유료";
}

export function serializeGymFacilities({
  selected,
  parkingType,
}: Pick<GymFacilityFields, "selected" | "parkingType">): string[] {
  const result = [...selected];
  if (parkingType) {
    result.push(`${PARKING_PREFIX}${parkingLabel(parkingType)}`);
  }
  return result;
}

export function parseGymFacilities(
  facilities: string[] | null | undefined,
  notes: string | null | undefined = "",
): GymFacilityFields {
  const selected: string[] = [];
  let parkingType: GymParkingType | null = null;

  for (const item of facilities ?? []) {
    if (item.startsWith(PARKING_PREFIX)) {
      const label = item.slice(PARKING_PREFIX.length);
      if (LEGACY_PARKING_FREE.has(item) || label === "무료") {
        parkingType = "free";
      } else if (LEGACY_PARKING_PAID.has(item) || label === "유료") {
        parkingType = "paid";
      }
      continue;
    }

    if (item === "주차 가능") {
      parkingType ??= "free";
      continue;
    }

    if (item === "무료 주차") {
      parkingType = "free";
      continue;
    }

    if (item === "에어컨" && !selected.includes("냉·난방")) {
      selected.push("냉·난방");
      continue;
    }

    if ((GYM_FACILITY_VALUES as readonly string[]).includes(item)) {
      if (!selected.includes(item)) selected.push(item);
      continue;
    }

    if (!selected.includes(item)) {
      selected.push(item);
    }
  }

  return {
    selected,
    parkingType,
    notes: notes ?? "",
  };
}
