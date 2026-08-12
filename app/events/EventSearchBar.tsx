"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function EventSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q") ?? "";
  const [value, setValue] = useState(queryFromUrl);

  useEffect(() => {
    setValue(queryFromUrl);
  }, [queryFromUrl]);

  function applySearch(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = next.trim();

    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }

    const query = params.toString();
    router.push(query ? `/events?${query}` : "/events");
  }

  useEffect(() => {
    if (value === queryFromUrl) return;

    const timer = window.setTimeout(() => {
      applySearch(value);
    }, 300);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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
          if (e.key === "Enter") {
            applySearch(value);
          }
        }}
        placeholder="이벤트 검색"
        aria-label="이벤트 검색"
        className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400"
      />
      <p className="mt-1 text-[11px] text-zinc-400">
        이벤트명 · 체육관명 · 지역명
      </p>
    </div>
  );
}
