"use client";

import { FieldLabel } from "@/components/FieldLabel";

type ToggleGroupProps = {
  label?: string;
  ariaLabel?: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function ToggleGroup({
  label,
  ariaLabel,
  options,
  value,
  onChange,
  required,
}: ToggleGroupProps) {
  const fieldName = label ?? ariaLabel ?? "선택";

  return (
    <fieldset
      aria-label={label ? undefined : fieldName}
      className="flex flex-col gap-2"
    >
      {label && (
        <legend className="text-sm font-semibold text-zinc-900">
          <FieldLabel required={required}>{label}</FieldLabel>
        </legend>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                selected
                  ? "bg-orange-600 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:border-orange-300"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

type MultiToggleGroupProps = {
  label: string;
  hint?: string;
  options: readonly { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
};

export function MultiToggleGroup({
  label,
  hint,
  options,
  values,
  onChange,
  required,
}: MultiToggleGroupProps) {
  function toggle(optionValue: string) {
    if (optionValue === "전국") {
      onChange(values.includes("전국") ? [] : ["전국"]);
      return;
    }

    const withoutNational = values.filter((v) => v !== "전국");
    if (withoutNational.includes(optionValue)) {
      onChange(withoutNational.filter((v) => v !== optionValue));
      return;
    }

    onChange([...withoutNational, optionValue]);
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-semibold text-zinc-900">
        <FieldLabel required={required}>{label}</FieldLabel>
      </legend>
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = values.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                selected
                  ? "bg-orange-600 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:border-orange-300"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
