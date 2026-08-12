"use client";

import type { GymProfileCompletion } from "@/lib/utils/gym-profile-completion";

type GymProfileCompletionBarProps = {
  completion: GymProfileCompletion;
};

export function GymProfileCompletionBar({
  completion,
}: GymProfileCompletionBarProps) {
  const { completed, total, percent, missing } = completion;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">프로필 완성도</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            선택 항목 {completed}/{total}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-orange-600">
          {percent}%
        </span>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`프로필 완성도 ${percent}%`}
      >
        <div
          className="h-full rounded-full bg-orange-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      {missing.length > 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-zinc-600">
          <span className="font-medium text-zinc-700">남은 항목 · </span>
          {missing.join(" · ")}
        </p>
      ) : (
        <p className="mt-3 text-xs font-medium text-orange-700">
          선택 항목을 모두 채웠습니다
        </p>
      )}
    </div>
  );
}
