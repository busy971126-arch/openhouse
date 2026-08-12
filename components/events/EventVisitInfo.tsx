import type { Event } from "@/lib/types/database";

type EventVisitInfoProps = {
  event: Pick<Event, "gi_rental" | "visit_details">;
};

export function EventVisitInfo({ event }: EventVisitInfoProps) {
  const items = [
    { label: "도복 대여", value: event.gi_rental },
    { label: "출입 안내", value: event.visit_details },
  ].filter((item) => item.value?.trim());

  if (items.length === 0) return null;

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-zinc-900">참가 안내</h2>
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
