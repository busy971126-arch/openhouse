"use client";

import { FieldLabel } from "@/components/FieldLabel";

export type ChipOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type ChipMultiSelectProps = {
  label: string;
  labelNote?: string;
  required?: boolean;
  options: readonly ChipOption[];
  values: string[];
  onChange: (values: string[]) => void;
  /** true면 하나만 선택 가능 */
  single?: boolean;
};

export function ChipMultiSelect({
  label,
  labelNote,
  required,
  options,
  values,
  onChange,
  single = false,
}: ChipMultiSelectProps) {
  function toggleValue(value: string) {
    if (single) {
      onChange(values.includes(value) ? [] : [value]);
      return;
    }
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }
    onChange([...values, value]);
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-semibold text-zinc-900">
        <FieldLabel required={required}>{label}</FieldLabel>
        {labelNote && (
          <span className="ml-2 text-xs font-normal text-zinc-600">
            {labelNote}
          </span>
        )}
      </legend>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          if (option.disabled) {
            return (
              <span
                key={option.value}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-400"
              >
                {option.label}
              </span>
            );
          }

          const selected = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleValue(option.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                selected
                  ? "bg-orange-600 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:border-orange-300"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
