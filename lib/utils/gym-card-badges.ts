import { MAX_GYM_CARD_FACILITY_BADGES } from "@/lib/constants/gym-search";
import { getFacilityIcon } from "@/lib/constants/gym";
import { formatFacilityLabel, parseGymFacilities } from "@/lib/utils/gym-facilities";
import type { Gym } from "@/lib/types/database";

export type GymCardBadge = {
  key: string;
  label: string;
  icon: string;
};

export function getGymCardBadges(gym: Pick<Gym, "facilities" | "facility_notes" | "first_visit_welcome">): GymCardBadge[] {
  const badges: GymCardBadge[] = [];
  const { selected, parkingType } = parseGymFacilities(
    gym.facilities,
    gym.facility_notes,
  );

  if (gym.first_visit_welcome) {
    badges.push({ key: "beginner", label: "초보 환영", icon: "🟢" });
  }

  if (parkingType === "free") {
    badges.push({ key: "parking-free", label: "무료 주차", icon: "🚗" });
  } else if (parkingType === "paid") {
    badges.push({ key: "parking-paid", label: "유료 주차", icon: "🅿" });
  }

  for (const facility of selected) {
    const label = formatFacilityLabel(facility);
    badges.push({
      key: facility,
      label,
      icon: getFacilityIcon(label),
    });
  }

  return badges.slice(0, MAX_GYM_CARD_FACILITY_BADGES);
}
