"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type EventViewMode = "list" | "calendar";

export function EventViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") as EventViewMode | null) ?? "list";

  function setView(next: EventViewMode) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "list") {
      params.delete("view");
    } else {
      params.set("view", next);
    }
    const query = params.toString();
    router.push(query ? `/events?${query}` : "/events");
  }

  return (
    <div className="flex rounded-xl bg-zinc-100 p-1">
      {(
        [
          { value: "list" as const, label: "목록" },
          { value: "calendar" as const, label: "캘린더" },
        ] as const
      ).map((option) => {
        const isActive = view === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setView(option.value)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              isActive
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
