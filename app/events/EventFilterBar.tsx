"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  EVENT_RECRUITMENT_FILTER_OPTIONS,
  type EventRecruitmentFilter,
} from "@/lib/constants/event-recruitment-filter";
import {
  buildFilterDate,
  EVENT_FILTER_DAY_OPTIONS,
  EVENT_FILTER_MONTH_OPTIONS,
  EVENT_REGION_FILTER_OPTIONS,
  getEventFilterYearOptions,
  parseFilterDate,
} from "@/lib/constants/event-filters";
import { EVENT_SPORT_FILTER_OPTIONS } from "@/lib/constants/sports";
import {
  EVENT_QUICK_FILTER_OPTIONS,
  type EventQuickFilter,
} from "@/lib/utils/event-quick-filters";

type FilterKey = "sport" | "region" | "date" | "status" | null;

const selectClassName =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900";

function getActiveLabel(
  key: FilterKey,
  params: URLSearchParams,
): string | null {
  if (key === "sport") {
    return params.get("sport");
  }
  if (key === "region") {
    if (params.get("quick") === "nearby") return "내 지역";
    return params.get("region");
  }
  if (key === "date") {
    const quick = params.get("quick") as EventQuickFilter | null;
    if (quick === "today") return "오늘";
    if (quick === "week") return "이번 주";
    if (quick === "month") return "이번 달";
    const date = params.get("date");
    return date ? date.replace(/-/g, ".") : null;
  }
  if (key === "status") {
    const status = params.get("status") as EventRecruitmentFilter | null;
    if (!status || status === "all") return null;
    return (
      EVENT_RECRUITMENT_FILTER_OPTIONS.find((option) => option.value === status)
        ?.label ?? null
    );
  }
  return null;
}

function hasAnyFilter(params: URLSearchParams): boolean {
  return (
    !!params.get("sport") ||
    !!params.get("region") ||
    params.get("quick") === "nearby" ||
    !!params.get("date") ||
    ["today", "week", "month"].includes(params.get("quick") ?? "") ||
    (!!params.get("status") && params.get("status") !== "recruiting")
  );
}

export function EventFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openFilter, setOpenFilter] = useState<FilterKey>(null);

  const dateParts = parseFilterDate(searchParams.get("date") ?? "");
  const yearOptions = getEventFilterYearOptions();

  function pushParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    const query = params.toString();
    router.push(query ? `/events?${query}` : "/events");
    setOpenFilter(null);
  }

  function clearFilter(key: FilterKey) {
    pushParams((params) => {
      if (key === "sport") params.delete("sport");
      if (key === "region") {
        params.delete("region");
        if (params.get("quick") === "nearby") params.delete("quick");
      }
      if (key === "date") {
        params.delete("date");
        const quick = params.get("quick");
        if (quick === "today" || quick === "week" || quick === "month") {
          params.delete("quick");
        }
      }
      if (key === "status") params.delete("status");
    });
  }

  function clearAllFilters() {
    pushParams((params) => {
      params.delete("sport");
      params.delete("region");
      params.delete("date");
      params.delete("status");
      const quick = params.get("quick");
      if (
        quick === "nearby" ||
        quick === "today" ||
        quick === "week" ||
        quick === "month"
      ) {
        params.delete("quick");
      }
    });
  }

  const filters: { key: FilterKey; label: string }[] = [
    { key: "sport", label: "종목" },
    { key: "region", label: "지역" },
    { key: "date", label: "날짜" },
    { key: "status", label: "모집 상태" },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => {
          const activeLabel = getActiveLabel(filter.key, searchParams);
          const isOpen = openFilter === filter.key;
          const isActive = !!activeLabel;

          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setOpenFilter(isOpen ? null : filter.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isActive || isOpen
                  ? "bg-orange-600 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {activeLabel ? `${filter.label}: ${activeLabel}` : filter.label}
            </button>
          );
        })}
        {hasAnyFilter(searchParams) && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
          >
            초기화
          </button>
        )}
      </div>

      {openFilter === "sport" && (
        <FilterPanel title="종목" onClear={() => clearFilter("sport")}>
          <div className="flex flex-wrap gap-2">
            <OptionButton
              label="전체"
              active={!searchParams.get("sport")}
              onClick={() => pushParams((params) => params.delete("sport"))}
            />
            {EVENT_SPORT_FILTER_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label.replace("(준비중)", "")}
                active={searchParams.get("sport") === option.value}
                disabled={option.disabled}
                onClick={() =>
                  pushParams((params) => params.set("sport", option.value))
                }
              />
            ))}
          </div>
        </FilterPanel>
      )}

      {openFilter === "region" && (
        <FilterPanel title="지역" onClear={() => clearFilter("region")}>
          <div className="flex flex-wrap gap-2">
            <OptionButton
              label="전체"
              active={
                !searchParams.get("region") &&
                searchParams.get("quick") !== "nearby"
              }
              onClick={() =>
                pushParams((params) => {
                  params.delete("region");
                  if (params.get("quick") === "nearby") params.delete("quick");
                })
              }
            />
            <OptionButton
              label="내 지역"
              active={searchParams.get("quick") === "nearby"}
              onClick={() =>
                pushParams((params) => {
                  params.set("quick", "nearby");
                  params.delete("region");
                })
              }
            />
            {EVENT_REGION_FILTER_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                active={searchParams.get("region") === option.value}
                onClick={() =>
                  pushParams((params) => {
                    params.delete("quick");
                    params.set("region", option.value);
                  })
                }
              />
            ))}
          </div>
        </FilterPanel>
      )}

      {openFilter === "date" && (
        <FilterPanel title="날짜" onClear={() => clearFilter("date")}>
          <div className="flex flex-wrap gap-2">
            {EVENT_QUICK_FILTER_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                active={searchParams.get("quick") === option.value}
                onClick={() =>
                  pushParams((params) => {
                    params.set("quick", option.value);
                    params.delete("date");
                  })
                }
              />
            ))}
          </div>
          <form
            className="mt-4 grid grid-cols-3 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const filterDate = buildFilterDate(
                form.get("dateYear")?.toString() ?? "",
                form.get("dateMonth")?.toString() ?? "",
                form.get("dateDay")?.toString() ?? "",
              );
              pushParams((params) => {
                const quick = params.get("quick");
                if (quick === "today" || quick === "week" || quick === "month") {
                  params.delete("quick");
                }
                if (filterDate) {
                  params.set("date", filterDate);
                } else {
                  params.delete("date");
                }
              });
            }}
          >
            <select
              name="dateYear"
              defaultValue={dateParts.year}
              className={selectClassName}
              aria-label="연도"
            >
              <option value="">연</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
            <select
              name="dateMonth"
              defaultValue={dateParts.month}
              className={selectClassName}
              aria-label="월"
            >
              <option value="">월</option>
              {EVENT_FILTER_MONTH_OPTIONS.map((month) => (
                <option key={month} value={month}>
                  {Number(month)}월
                </option>
              ))}
            </select>
            <select
              name="dateDay"
              defaultValue={dateParts.day}
              className={selectClassName}
              aria-label="일"
            >
              <option value="">일</option>
              {EVENT_FILTER_DAY_OPTIONS.map((day) => (
                <option key={day} value={day}>
                  {Number(day)}일
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="col-span-3 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              직접 선택
            </button>
          </form>
        </FilterPanel>
      )}

      {openFilter === "status" && (
        <FilterPanel title="모집 상태" onClear={() => clearFilter("status")}>
          <div className="flex flex-wrap gap-2">
            {EVENT_RECRUITMENT_FILTER_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                label={option.label}
                active={
                  (searchParams.get("status") as EventRecruitmentFilter | null) ===
                    option.value ||
                  (!searchParams.get("status") && option.value === "recruiting")
                }
                onClick={() =>
                  pushParams((params) => {
                    if (option.value === "recruiting") {
                      params.delete("status");
                    } else {
                      params.set("status", option.value);
                    }
                  })
                }
              />
            ))}
          </div>
        </FilterPanel>
      )}
    </div>
  );
}

function FilterPanel({
  title,
  onClear,
  children,
}: {
  title: string;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-orange-600 hover:text-orange-700"
        >
          초기화
        </button>
      </div>
      {children}
    </div>
  );
}

function OptionButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        disabled
          ? "cursor-not-allowed border border-zinc-200 bg-zinc-50 text-zinc-400"
          : active
            ? "bg-orange-600 text-white"
            : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      {label}
    </button>
  );
}
