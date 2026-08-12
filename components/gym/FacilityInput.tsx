"use client";

import { useState } from "react";
import { SignupField } from "@/components/SignupField";
import {
  GYM_FACILITY_OPTIONS,
  GYM_FACILITY_VALUES,
  GYM_PARKING_OPTIONS,
  type GymParkingType,
} from "@/lib/constants/gym";
import type { GymFacilityFields } from "@/lib/utils/gym-facilities";

type FacilityInputProps = {
  value: GymFacilityFields;
  onChange: (value: GymFacilityFields) => void;
};

const MAX_CUSTOM_FACILITY_LENGTH = 24;

function isPresetFacility(value: string) {
  return (GYM_FACILITY_VALUES as readonly string[]).includes(value);
}

export function FacilityInput({ value, onChange }: FacilityInputProps) {
  const [draft, setDraft] = useState("");

  const customFacilities = value.selected.filter((item) => !isPresetFacility(item));

  function toggleFacility(facility: string) {
    const selected = value.selected.includes(facility)
      ? value.selected.filter((item) => item !== facility)
      : [...value.selected, facility];
    onChange({ ...value, selected });
  }

  function toggleParking(enabled: boolean) {
    onChange({
      ...value,
      parkingType: enabled ? (value.parkingType ?? "free") : null,
    });
  }

  function setParkingType(parkingType: GymParkingType) {
    onChange({ ...value, parkingType });
  }

  function addCustomFacility() {
    const normalized = draft.trim().replace(/\s+/g, " ").slice(0, MAX_CUSTOM_FACILITY_LENGTH);
    if (!normalized) return;

    const duplicatePreset = GYM_FACILITY_OPTIONS.find(
      (option) => option.label === normalized || option.value === normalized,
    );
    if (duplicatePreset) {
      if (!value.selected.includes(duplicatePreset.value)) {
        onChange({
          ...value,
          selected: [...value.selected, duplicatePreset.value],
        });
      }
      setDraft("");
      return;
    }

    if (value.selected.includes(normalized)) {
      setDraft("");
      return;
    }

    onChange({
      ...value,
      selected: [...value.selected, normalized],
    });
    setDraft("");
  }

  function removeCustomFacility(facility: string) {
    onChange({
      ...value,
      selected: value.selected.filter((item) => item !== facility),
    });
  }

  const parkingEnabled = value.parkingType !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {GYM_FACILITY_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-800"
          >
            <input
              type="checkbox"
              checked={value.selected.includes(option.value)}
              onChange={() => toggleFacility(option.value)}
              className="size-4 accent-orange-600"
            />
            {option.label}
          </label>
        ))}

        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-800">
            <input
              type="checkbox"
              checked={parkingEnabled}
              onChange={(e) => toggleParking(e.target.checked)}
              className="size-4 accent-orange-600"
            />
            주차 가능
          </label>

          {parkingEnabled && (
            <div
              className="ml-6 flex gap-4"
              role="radiogroup"
              aria-label="주차 요금"
            >
              {GYM_PARKING_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800"
                >
                  <input
                    type="radio"
                    name="parking-type"
                    checked={value.parkingType === option.value}
                    onChange={() => setParkingType(option.value)}
                    className="size-4 accent-orange-600"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {customFacilities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customFacilities.map((facility) => (
            <button
              key={facility}
              type="button"
              onClick={() => removeCustomFacility(facility)}
              className="inline-flex items-center gap-1 rounded-full bg-orange-600 px-3 py-1.5 text-sm font-medium text-white"
            >
              {facility}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-zinc-900">직접 추가</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomFacility();
              }
            }}
            placeholder="예: 스팀사우나, 키즈존"
            maxLength={MAX_CUSTOM_FACILITY_LENGTH}
            className="min-w-0 flex-1 rounded-lg border border-zinc-400 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
          <button
            type="button"
            onClick={addCustomFacility}
            disabled={!draft.trim()}
            className="shrink-0 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            추가
          </button>
        </div>
      </div>

      <SignupField label="시설 안내" hint="선택">
        <textarea
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          rows={3}
          placeholder="예: 남녀 샤워실 분리, 사물함 월 1만원"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />
      </SignupField>
    </div>
  );
}
