import type { Event, Gym } from "@/lib/types/database";
import {
  createEmptyGymAddress,
  formatGymAddress,
  gymAddressFromStored,
  type GymAddressValue,
} from "@/lib/utils/address-region";

export function getEventLocationDefaults(
  event?: Pick<Event, "address" | "region"> | null,
  gym?: Pick<Gym, "address" | "region"> | null,
): GymAddressValue {
  if (event?.address?.trim() || event?.region?.trim()) {
    return gymAddressFromStored(event.address, event.region);
  }

  if (gym?.address?.trim() || gym?.region?.trim()) {
    return gymAddressFromStored(gym.address, gym.region);
  }

  return createEmptyGymAddress();
}

export function getEventDisplayAddress(
  event: Pick<Event, "address" | "region">,
  gym?: Pick<Gym, "address" | "region"> | null,
): string | null {
  const eventAddress = event.address?.trim();
  if (eventAddress) return eventAddress;

  return gym?.address?.trim() || null;
}

export function validateEventLocation(value: GymAddressValue): string | null {
  if (!value.roadAddress.trim()) {
    return "장소 주소를 입력해주세요.";
  }

  if (!value.region.trim()) {
    return "주소에서 활동 지역을 확인할 수 없습니다. 다시 검색해주세요.";
  }

  return null;
}

export function eventLocationToPayload(value: GymAddressValue) {
  return {
    region: value.region.trim(),
    address: formatGymAddress(value) || null,
  };
}
