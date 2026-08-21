"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";

export function HomeSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(next = value) {
    const trimmed = next.trim();
    router.push(trimmed ? `/events?q=${encodeURIComponent(trimmed)}` : "/events");
  }

  return (
    <div className="relative">
      <AppIcon
        name="search"
        className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-zinc-400"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="체육관, 지역, 이벤트 검색"
        aria-label="체육관, 지역, 이벤트 검색"
        className="w-full border-0 border-b border-zinc-300 bg-transparent py-3 pl-10 pr-2 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-orange-600"
      />
    </div>
  );
}
