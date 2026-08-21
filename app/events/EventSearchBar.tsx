"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppIcon } from "@/components/ui/AppIcon";

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

    if (trimmed) params.set("q", trimmed);
    else params.delete("q");

    const query = params.toString();
    router.push(query ? `/events?${query}` : "/events");
  }

  useEffect(() => {
    if (value === queryFromUrl) return;
    const timer = window.setTimeout(() => applySearch(value), 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <AppIcon
        name="search"
        className="pointer-events-none absolute left-0 top-1/2 size-[18px] -translate-y-1/2 text-zinc-400"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") applySearch(value);
        }}
        placeholder="이벤트 · 체육관 · 지역 검색"
        aria-label="이벤트 검색"
        className="w-full border-0 border-b border-zinc-300 bg-transparent py-3 pl-7 pr-2 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 focus:border-orange-600"
      />
    </div>
  );
}
