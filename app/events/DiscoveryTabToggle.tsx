"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type DiscoveryTab = "events" | "gyms";

export function DiscoveryTabToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab =
    (searchParams.get("tab") as DiscoveryTab | null) === "gyms"
      ? "gyms"
      : "events";

  function setTab(next: DiscoveryTab) {
    const params = new URLSearchParams();

    if (next === "gyms") {
      params.set("tab", "gyms");
      const q = searchParams.get("q");
      if (q) params.set("q", q);
      const sport = searchParams.get("sport");
      if (sport) params.set("sport", sport);
      const region = searchParams.get("region");
      if (region) params.set("region", region);
      const facility = searchParams.get("facility");
      if (facility) params.set("facility", facility);
      if (searchParams.get("beginner") === "1") params.set("beginner", "1");
      if (searchParams.get("quick") === "nearby") params.set("quick", "nearby");
      if (searchParams.get("hasEvents") === "1") params.set("hasEvents", "1");
      const sort = searchParams.get("sort");
      if (sort) params.set("sort", sort);
    } else {
      const q = searchParams.get("q");
      if (q) params.set("q", q);
      const sport = searchParams.get("sport");
      if (sport) params.set("sport", sport);
      const region = searchParams.get("region");
      if (region) params.set("region", region);
      const date = searchParams.get("date");
      if (date) params.set("date", date);
      const quick = searchParams.get("quick");
      if (quick) params.set("quick", quick);
      const status = searchParams.get("status");
      if (status) params.set("status", status);
      const view = searchParams.get("view");
      if (view) params.set("view", view);
    }

    const query = params.toString();
    router.push(query ? `/events?${query}` : "/events");
  }

  return (
    <div className="flex gap-6 border-b border-zinc-300">
      {(
        [
          { value: "events" as const, label: "EVENTS", subLabel: "이벤트" },
          { value: "gyms" as const, label: "GYMS", subLabel: "체육관" },
        ] as const
      ).map((option) => {
        const isActive = tab === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTab(option.value)}
            className={`relative pb-3 text-left transition ${
              isActive ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-700"
            }`}
          >
            <span className="block text-[10px] font-black tracking-[0.16em]">
              {option.label}
            </span>
            <span className="mt-0.5 block text-sm font-bold">{option.subLabel}</span>
            {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-orange-600" />}
          </button>
        );
      })}
    </div>
  );
}
