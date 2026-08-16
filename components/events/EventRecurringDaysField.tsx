"use client";

import {
  RECURRING_DAY_OPTIONS,
  setRecurringDayPreset,
  toggleRecurringDay,
  type EventRecurringDay,
} from "@/lib/constants/event-recurring-days";

type EventRecurringDaysFieldProps = {
  value: EventRecurringDay[];
  onChange: (value: EventRecurringDay[]) => void;
};

export function EventRecurringDaysField({
  value,
  onChange,
}: EventRecurringDaysFieldProps) {
  return (
    <fieldset className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <legend className="px-1 text-sm font-medium text-zinc-900">
        반복 요일 (선택)
      </legend>
      <p className="mt-1 text-xs text-zinc-500">
        정기로 열리는 일정이면 해당 요일을 선택하세요. 1회성 이벤트는 비워두면
        됩니다.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(setRecurringDayPreset("weekday"))}
          className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
        >
          주중
        </button>
        <button
          type="button"
          onClick={() => onChange(setRecurringDayPreset("weekend"))}
          className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
        >
          주말
        </button>
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
          >
            선택 해제
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {RECURRING_DAY_OPTIONS.map((option) => {
          const checked = value.includes(option.value);

          return (
            <label
              key={option.value}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                checked
                  ? "border-orange-300 bg-orange-50 text-orange-800"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(toggleRecurringDay(value, option.value))}
                className="size-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
