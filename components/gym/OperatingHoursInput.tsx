import { SignupField } from "@/components/SignupField";
import type { OperatingHoursFields } from "@/lib/utils/operating-hours";

type OperatingHoursInputProps = {
  value: OperatingHoursFields;
  onChange: (value: OperatingHoursFields) => void;
};

function TimeField({
  label,
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  label: string;
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  return (
    <SignupField label={label}>
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-zinc-400 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />
        <span className="shrink-0 text-sm text-zinc-500">~</span>
        <input
          type="time"
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-zinc-400 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />
      </div>
    </SignupField>
  );
}

export function OperatingHoursInput({ value, onChange }: OperatingHoursInputProps) {
  return (
    <div className="flex flex-col gap-4">
      <TimeField
        label="평일"
        start={value.weekday.start}
        end={value.weekday.end}
        onStartChange={(start) =>
          onChange({ ...value, weekday: { ...value.weekday, start } })
        }
        onEndChange={(end) =>
          onChange({ ...value, weekday: { ...value.weekday, end } })
        }
      />
      <TimeField
        label="주말"
        start={value.weekend.start}
        end={value.weekend.end}
        onStartChange={(start) =>
          onChange({ ...value, weekend: { ...value.weekend, start } })
        }
        onEndChange={(end) =>
          onChange({ ...value, weekend: { ...value.weekend, end } })
        }
      />
    </div>
  );
}
