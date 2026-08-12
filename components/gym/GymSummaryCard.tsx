import type { Gym } from "@/lib/types/database";
import { formatFacilityLabel } from "@/lib/utils/gym-facilities";

type GymSummaryCardProps = {
  gym: Gym;
  /** 이벤트 등록 폼 등 compact 표시 */
  compact?: boolean;
};

export function GymSummaryCard({ gym, compact = false }: GymSummaryCardProps) {
  const facilities = (gym.facilities ?? []).map(formatFacilityLabel);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="mb-3 text-xs font-medium text-zinc-500">
        선택한 체육관 · 자동 입력
      </p>

      <div className="flex gap-3">
        {gym.photo_url ? (
          <img
            src={gym.photo_url}
            alt={gym.name}
            className={`shrink-0 rounded-lg border border-zinc-200 object-cover ${
              compact ? "size-16" : "size-20"
            }`}
          />
        ) : (
          <div
            className={`flex shrink-0 items-center justify-center rounded-lg bg-zinc-100 ${
              compact ? "size-16 text-xl" : "size-20 text-2xl"
            }`}
          >
            🏢
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900">{gym.name}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {gym.sport ?? "유도"} · {gym.region}
          </p>
          {gym.address ? (
            <p className="mt-2 text-sm text-zinc-700">📍 {gym.address}</p>
          ) : (
            <p className="mt-2 text-sm text-red-600">
              주소가 없습니다. 체육관 정보에서 주소를 등록해주세요.
            </p>
          )}
        </div>
      </div>

      {!compact && facilities.length > 0 && (
        <p className="mt-3 border-t border-zinc-200 pt-3 text-sm text-zinc-600">
          시설: {facilities.join(" · ")}
        </p>
      )}

      {!compact && (gym.phone || gym.instagram_url) && (
        <div className="mt-2 text-sm text-zinc-600">
          {gym.phone && <p>📞 {gym.phone}</p>}
          {gym.instagram_url && (
            <p className="truncate">📷 {gym.instagram_url}</p>
          )}
        </div>
      )}
    </div>
  );
}
