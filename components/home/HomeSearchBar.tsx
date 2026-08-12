"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HomeSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function submit(next = value) {
    const trimmed = next.trim();
    router.push(trimmed ? `/events?q=${encodeURIComponent(trimmed)}` : "/events");
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="운동, 체육관, 이벤트 검색"
        aria-label="운동, 체육관, 이벤트 검색"
        className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400"
      />
    </div>
  );
}
