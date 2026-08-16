"use client";

import { AddressSearchField } from "@/components/AddressSearchField";
import {
  gymAddressFromStored,
  type GymAddressValue,
} from "@/lib/utils/address-region";
import type { Gym } from "@/lib/types/database";

type EventLocationFieldsProps = {
  value: GymAddressValue;
  onChange: (value: GymAddressValue) => void;
  selectedGym?: Pick<Gym, "name" | "address" | "region"> | null;
};

export function EventLocationFields({
  value,
  onChange,
  selectedGym,
}: EventLocationFieldsProps) {
  const canLoadFromGym = Boolean(
    selectedGym?.address?.trim() || selectedGym?.region?.trim(),
  );

  function loadFromGym() {
    if (!selectedGym) return;

    onChange(gymAddressFromStored(selectedGym.address, selectedGym.region));
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-900">장소</p>
          <p className="mt-1 text-xs text-zinc-500">
            이번 일정이 열리는 주소입니다. 체육관 주소와 다를 수 있습니다.
          </p>
        </div>
        {canLoadFromGym && (
          <button
            type="button"
            onClick={loadFromGym}
            className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            체육관 주소 불러오기
          </button>
        )}
      </div>

      <div className="mt-4">
        <AddressSearchField value={value} onChange={onChange} required />
      </div>
    </div>
  );
}
