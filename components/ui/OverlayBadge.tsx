import type { ReactNode } from "react";

const badgeBase =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm";

type OverlayBadgeProps = {
  children: ReactNode;
  className?: string;
};

/** 사진 위 주요 배지 — 종목 등 */
export function OverlayBadgePrimary({ children, className = "" }: OverlayBadgeProps) {
  return (
    <span className={`${badgeBase} bg-black/55 text-white ${className}`}>
      {children}
    </span>
  );
}

/** 사진 위 보조 배지 — 이벤트 유형, 모집 상태 등 */
export function OverlayBadgeSecondary({
  children,
  className = "",
}: OverlayBadgeProps) {
  return (
    <span
      className={`${badgeBase} bg-white/90 text-zinc-800 shadow-sm ${className}`}
    >
      {children}
    </span>
  );
}

/** 사진 위 라벨 — 시설명 등 */
export function OverlayPhotoLabel({ children }: OverlayBadgeProps) {
  return (
    <span className="inline-flex max-w-[80%] items-center text-sm font-semibold leading-normal text-white whitespace-nowrap drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
      {children}
    </span>
  );
}

export function PhotoBottomGradient() {
  return (
    <div
      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5"
      aria-hidden
    />
  );
}
