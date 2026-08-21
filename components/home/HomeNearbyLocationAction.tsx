"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
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
      router.push(`/events?quick=nearby&region=${encodeURIComponent(region)}`);
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
        className="flex w-full items-center justify-center gap-2 bg-zinc-950 px-3 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
      >
        <AppIcon name="map-pin" className="size-4" />
        {loading ? "위치 확인 중..." : "현재 위치로 찾기"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
