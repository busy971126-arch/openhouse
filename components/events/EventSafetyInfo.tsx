import type { Event } from "@/lib/types/database";

type EventSafetyInfoProps = {
  event: Pick<
    Event,
    | "safety_rules"
    | "prohibited_techniques"
    | "requirements"
    | "safety_notes"
    | "emergency_contact"
  >;
};

export function EventSafetyInfo({ event }: EventSafetyInfoProps) {
  const items = [
    { label: "대련 규칙", value: event.safety_rules },
    { label: "금지 기술", value: event.prohibited_techniques },
    { label: "참가 조건", value: event.requirements },
    { label: "안전 수칙", value: event.safety_notes },
    { label: "응급 연락", value: event.emergency_contact },
  ].filter((item) => item.value?.trim());

  if (items.length === 0) return null;

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-zinc-900">안전 정보</h2>
      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={item.label}>
            <p className="text-xs font-medium text-zinc-500">{item.label}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800">
              {item.value}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
