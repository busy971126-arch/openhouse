"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GYM_SHEET_FACILITY_OPTIONS,
  GYM_SHEET_OPERATION_OPTIONS,
  type GymSheetFacility,
  type GymSheetOperation,
} from "@/lib/constants/gym-search";
import { EVENT_SPORT_FILTER_OPTIONS } from "@/lib/constants/sports";
import {
  findProvinceIdForRegion,
  formatRegionFilterLabel,
  getDistrictOptionsForProvince,
  getProvinceNodes,
} from "@/lib/utils/region-filter";

type DraftFilters = {
  sport: string;
  region: string;
  nearby: boolean;
  facilities: GymSheetFacility[];
  operations: GymSheetOperation[];
};

function parseFacilitiesParam(value: string | null): GymSheetFacility[] {
  if (!value) return [];
  return value
    .split(",")
    .filter((item): item is GymSheetFacility =>
      GYM_SHEET_FACILITY_OPTIONS.some((option) => option.value === item),
    );
}

function readDraftFromParams(params: URLSearchParams): DraftFilters {
  const operations: GymSheetOperation[] = [];
  if (params.get("beginner") === "1") operations.push("beginner");
  if (params.get("hasEvents") === "1") operations.push("has_events");

  return {
    sport: params.get("sport") ?? "",
    region: params.get("region") ?? "",
    nearby: params.get("quick") === "nearby",
    facilities: parseFacilitiesParam(params.get("facilities")),
    operations,
  };
}

function countSheetFilters(params: URLSearchParams): number {
  let count = 0;
  if (params.get("sport")) count += 1;
  if (params.get("region") || params.get("quick") === "nearby") count += 1;
  if (params.get("facilities")) count += 1;
  return count;
}

type GymFilterSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function GymFilterSheet({ open, onClose }: GymFilterSheetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<DraftFilters>(() =>
    readDraftFromParams(searchParams),
  );
  const [regionProvinceId, setRegionProvinceId] = useState<string | null>(() =>
    findProvinceIdForRegion(searchParams.get("region")),
  );

  useEffect(() => {
    if (open) {
      setDraft(readDraftFromParams(searchParams));
      setRegionProvinceId(findProvinceIdForRegion(searchParams.get("region")));
    }
  }, [open, searchParams]);

  const activeRegionProvinceId =
    regionProvinceId ?? findProvinceIdForRegion(draft.region);
  const districtOptions = activeRegionProvinceId
    ? getDistrictOptionsForProvince(activeRegionProvinceId)
    : [];

  const regionLabel = useMemo(() => {
    if (draft.nearby) return "내 주변";
    if (draft.region) return formatRegionFilterLabel(draft.region);
    return null;
  }, [draft.nearby, draft.region]);

  function toggleFacility(value: GymSheetFacility) {
    setDraft((current) => ({
      ...current,
      facilities: current.facilities.includes(value)
        ? current.facilities.filter((item) => item !== value)
        : [...current.facilities, value],
    }));
  }

  function toggleOperation(value: GymSheetOperation) {
    setDraft((current) => ({
      ...current,
      operations: current.operations.includes(value)
        ? current.operations.filter((item) => item !== value)
        : [...current.operations, value],
    }));
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "gyms");

    if (draft.sport) {
      params.set("sport", draft.sport);
    } else {
      params.delete("sport");
    }

    if (draft.nearby) {
      params.set("quick", "nearby");
      params.delete("region");
    } else if (draft.region) {
      params.set("region", draft.region);
      params.delete("quick");
    } else {
      params.delete("region");
      params.delete("quick");
    }

    if (draft.facilities.length) {
      params.set("facilities", draft.facilities.join(","));
    } else {
      params.delete("facilities");
    }

    if (draft.operations.includes("beginner")) {
      params.set("beginner", "1");
    } else {
      params.delete("beginner");
    }

    if (draft.operations.includes("has_events")) {
      params.set("hasEvents", "1");
    } else {
      params.delete("hasEvents");
    }

    router.push(`/events?${params.toString()}`);
    onClose();
  }

  function resetDraft() {
    setDraft({
      sport: "",
      region: "",
      nearby: false,
      facilities: [],
      operations: [],
    });
    setRegionProvinceId(null);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="필터 닫기"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gym-filter-title"
        className="relative mx-auto flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4">
          <h2 id="gym-filter-title" className="text-lg font-semibold text-zinc-900">
            필터
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            닫기
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <FilterSection title="종목">
            <select
              value={draft.sport}
              onChange={(e) =>
                setDraft((current) => ({ ...current, sport: e.target.value }))
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900"
            >
              <option value="">전체</option>
              {EVENT_SPORT_FILTER_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </FilterSection>

          <FilterSection title="지역">
            <div className="flex flex-wrap gap-2">
              <ChipButton
                label="전체"
                active={!draft.region && !draft.nearby}
                onClick={() => {
                  setDraft((current) => ({
                    ...current,
                    region: "",
                    nearby: false,
                  }));
                  setRegionProvinceId(null);
                }}
              />
              <ChipButton
                label="내 주변"
                active={draft.nearby}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    nearby: !current.nearby,
                    region: "",
                  }))
                }
              />
              {getProvinceNodes().map((province) => (
                <ChipButton
                  key={province.id}
                  label={province.label}
                  active={
                    !draft.nearby && activeRegionProvinceId === province.id
                  }
                  onClick={() => {
                    setDraft((current) => ({
                      ...current,
                      nearby: false,
                      region: "",
                    }));
                    setRegionProvinceId(province.id);
                  }}
                />
              ))}
            </div>

            {activeRegionProvinceId && districtOptions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
                {districtOptions.map((district) => (
                  <ChipButton
                    key={district.id}
                    label={district.label}
                    active={draft.region === district.value}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        nearby: false,
                        region: district.value ?? "",
                      }))
                    }
                  />
                ))}
              </div>
            )}

            {regionLabel && (
              <p className="mt-2 text-xs text-zinc-500">선택: {regionLabel}</p>
            )}
          </FilterSection>

          <FilterSection title="시설">
            <div className="flex flex-col gap-2">
              {GYM_SHEET_FACILITY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm text-zinc-800"
                >
                  <input
                    type="checkbox"
                    checked={draft.facilities.includes(option.value)}
                    onChange={() => toggleFacility(option.value)}
                    className="size-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="운영">
            <div className="flex flex-col gap-2">
              {GYM_SHEET_OPERATION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm text-zinc-800"
                >
                  <input
                    type="checkbox"
                    checked={draft.operations.includes(option.value)}
                    onChange={() => toggleOperation(option.value)}
                    className="size-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </FilterSection>
        </div>

        <div className="flex gap-2 border-t border-zinc-100 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={resetDraft}
            className="flex-1 rounded-xl border border-zinc-300 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="flex-1 rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white hover:bg-orange-700"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}

export function useGymFilterSheetActiveCount(): number {
  const searchParams = useSearchParams();
  return countSheetFilters(searchParams);
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-zinc-100 py-4 last:border-b-0">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900">{title}</h3>
      {children}
    </section>
  );
}

function ChipButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-orange-600 text-white"
          : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      {label}
    </button>
  );
}
