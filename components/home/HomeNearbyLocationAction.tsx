"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { resolveRegionFromCurrentPosition } from "@/lib/utils/geolocation-client";

export function HomeNearbyLocationAction() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLocate() {
    setLoading(true);
    setError(null);

    try {
      const region = await resolveRegionFromCurrentPosition();
      router.push(
        `/events?quick=nearby&region=${encodeURIComponent(region)}`,
      );
    } catch (locateError) {
      setError(
        locateError instanceof Error
          ? locateError.message
          : "현재 위치를 확인하지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLocate}
        disabled={loading}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
      >
        {loading ? "위치 확인 중..." : "📍 현재 위치로 찾기"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
