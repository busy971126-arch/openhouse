"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GYM_QUICK_OPTIONS,
  GYM_SORT_OPTIONS,
  type GymSort,
} from "@/lib/constants/gym-search";
import { GymFilterSheet, useGymFilterSheetActiveCount } from "./GymFilterSheet";

export function GymSearchOptions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const sheetFilterCount = useGymFilterSheetActiveCount();

  const sort = (searchParams.get("sort") as GymSort | null) ?? "recommended";
  const nearbyActive = searchParams.get("quick") === "nearby";
  const hasEventsActive = searchParams.get("hasEvents") === "1";
  const beginnerActive = searchParams.get("beginner") === "1";

  function pushParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "gyms");
    mutator(params);
    router.push(`/events?${params.toString()}`);
  }

  function toggleQuick(key: "nearby" | "has_events" | "beginner") {
    pushParams((params) => {
      if (key === "nearby") {
        if (params.get("quick") === "nearby") {
          params.delete("quick");
        } else {
          params.set("quick", "nearby");
          params.delete("region");
        }
        return;
      }

      if (key === "has_events") {
        if (params.get("hasEvents") === "1") {
          params.delete("hasEvents");
        } else {
          params.set("hasEvents", "1");
        }
        return;
      }

      if (params.get("beginner") === "1") {
        params.delete("beginner");
      } else {
        params.set("beginner", "1");
      }
    });
  }

  function setSort(next: GymSort) {
    pushParams((params) => {
      if (next === "recommended") {
        params.delete("sort");
      } else {
        params.set("sort", next);
      }
    });
  }

  function isQuickActive(value: (typeof GYM_QUICK_OPTIONS)[number]["value"]) {
    if (value === "nearby") return nearbyActive;
    if (value === "has_events") return hasEventsActive;
    return beginnerActive;
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-500">빠른 필터</p>
          <div className="flex flex-wrap gap-2">
            {GYM_QUICK_OPTIONS.map((option) => {
              const active = isQuickActive(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleQuick(option.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-orange-300 bg-orange-50 text-orange-800"
                      : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className={`relative rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                sheetFilterCount > 0
                  ? "border-orange-300 bg-orange-50 text-orange-800"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              ⚙️ 필터
              {sheetFilterCount > 0 && (
                <span className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                  {sheetFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 text-xs font-medium text-zinc-500">
              정렬
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as GymSort)}
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              aria-label="체육관 정렬"
            >
              {GYM_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <GymFilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} />
    </>
  );
}
