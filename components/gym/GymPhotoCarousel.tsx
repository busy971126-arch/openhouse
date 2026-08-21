"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GymDisplayPhoto } from "@/lib/utils/gym-display-photos";

type GymPhotoCarouselProps = {
  photos: GymDisplayPhoto[];
  alt: string;
  aspect?: "portrait" | "square" | "compact";
  className?: string;
  showPhotoLabels?: boolean;
  dotPosition?: "default" | "raised";
  onActiveIndexChange?: (index: number) => void;
};

const ASPECT_CLASS = {
  portrait: "aspect-[4/5]",
  square: "aspect-square",
  compact: "aspect-[6/5]",
} as const;

const DOT_SIZE_PX = 6;
const DOT_GAP_PX = 6;
const DOT_STEP_PX = DOT_SIZE_PX + DOT_GAP_PX;
const PAGE_NUMBER_HEIGHT_PX = 16;

function shouldShowFacilityLabel(photo: GymDisplayPhoto): boolean {
  return photo.showFacilityLabel !== false && photo.label.trim().length > 0;
}

export function GymPhotoCarousel({
  photos,
  alt,
  aspect = "portrait",
  className = "",
  showPhotoLabels = true,
  dotPosition = "default",
  onActiveIndexChange,
}: GymPhotoCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [brokenIndexes, setBrokenIndexes] = useState<Set<number>>(
    () => new Set(),
  );

  const aspectClass = ASPECT_CLASS[aspect];
  const hasRaisedDots =
    dotPosition === "raised" ||
    photos.some((photo) => showPhotoLabels && shouldShowFacilityLabel(photo));
  const dotsClass = hasRaisedDots ? "bottom-14" : "bottom-3";

  useEffect(() => {
    setBrokenIndexes(new Set());
    setActiveIndex(0);
    setScrollPosition(0);
  }, [photos]);

  useEffect(() => {
    onActiveIndexChange?.(activeIndex);
  }, [activeIndex, onActiveIndexChange]);

  const updateActiveIndex = useCallback(() => {
    const element = scrollRef.current;
    if (!element || element.clientWidth === 0) return;

    const lastIndex = Math.max(photos.length - 1, 0);
    const rawPosition = element.scrollLeft / element.clientWidth;
    const nextPosition = Math.min(lastIndex, Math.max(0, rawPosition));
    const index = Math.round(nextPosition);

    setScrollPosition(nextPosition);
    setActiveIndex(index);
  }, [photos.length]);

  function scrollTo(index: number) {
    const element = scrollRef.current;
    if (!element) return;

    element.scrollTo({
      left: index * element.clientWidth,
      behavior: "smooth",
    });
  }

  function markBroken(index: number) {
    setBrokenIndexes((current) => {
      if (current.has(index)) return current;
      const next = new Set(current);
      next.add(index);
      return next;
    });
  }

  if (photos.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-xs font-black tracking-[0.14em] text-zinc-400 ${aspectClass} ${className}`}
        aria-hidden
      >
        OPENHOUSE
      </div>
    );
  }

  const lowerIndex = Math.floor(scrollPosition);
  const upperIndex = Math.min(photos.length - 1, Math.ceil(scrollPosition));
  const progress = scrollPosition - lowerIndex;
  const lowerHasLabel =
    showPhotoLabels && shouldShowFacilityLabel(photos[lowerIndex]) ? 1 : 0;
  const upperHasLabel =
    showPhotoLabels && shouldShowFacilityLabel(photos[upperIndex]) ? 1 : 0;
  const labelOverlayOpacity =
    lowerIndex === upperIndex
      ? lowerHasLabel
      : lowerHasLabel * (1 - progress) + upperHasLabel * progress;
  const dotTrackWidth =
    photos.length * DOT_SIZE_PX + (photos.length - 1) * DOT_GAP_PX;
  const pageNumberWidthCh = Math.max(1, String(photos.length).length);

  return (
    <div className={`relative overflow-hidden bg-zinc-100 ${className}`}>
      <div
        ref={scrollRef}
        onScroll={updateActiveIndex}
        className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={`${alt} 사진`}
      >
        {photos.map((photo, index) => (
          <div
            key={`slide-${index}`}
            className={`relative min-w-full flex-[0_0_100%] snap-center ${aspectClass}`}
          >
            {brokenIndexes.has(index) ? (
              <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-xs font-black tracking-[0.14em] text-zinc-400">
                OPENHOUSE
              </div>
            ) : (
              <img
                src={photo.url}
                alt={`${alt} ${photo.label}`}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
                onError={() => markBroken(index)}
              />
            )}
          </div>
        ))}
      </div>

      {showPhotoLabels && (
        <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
          <div
            className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent will-change-[opacity]"
            style={{ opacity: labelOverlayOpacity }}
          />
          {photos.map((photo, index) => {
            if (!shouldShowFacilityLabel(photo)) return null;

            const opacity = Math.max(0, 1 - Math.abs(scrollPosition - index));
            return (
              <span
                key={`label-${index}`}
                className="absolute bottom-5 left-3 max-w-[80%] whitespace-nowrap text-sm font-semibold leading-normal text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] will-change-[opacity]"
                style={{ opacity }}
              >
                {photo.label}
              </span>
            );
          })}
        </div>
      )}

      {photos.length > 1 && (
        <>
          <div className="absolute right-3 top-3 z-20 flex items-center rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <span
              className="relative inline-block overflow-hidden"
              style={{
                width: `${pageNumberWidthCh}ch`,
                height: `${PAGE_NUMBER_HEIGHT_PX}px`,
              }}
              aria-hidden
            >
              <span
                className="absolute inset-x-0 top-0 flex flex-col items-center will-change-transform"
                style={{
                  transform: `translate3d(0, -${scrollPosition * PAGE_NUMBER_HEIGHT_PX}px, 0)`,
                }}
              >
                {photos.map((_, index) => (
                  <span
                    key={`page-number-${index}`}
                    className="block w-full text-center leading-4"
                    style={{ height: `${PAGE_NUMBER_HEIGHT_PX}px` }}
                  >
                    {index + 1}
                  </span>
                ))}
              </span>
            </span>
            <span aria-hidden>&nbsp;/ {photos.length}</span>
            <span className="sr-only">
              {activeIndex + 1} / {photos.length}
            </span>
          </div>

          <div
            className={`pointer-events-none absolute inset-x-0 ${dotsClass} z-20 flex justify-center`}
          >
            <div
              className="relative flex gap-1.5"
              style={{ width: `${dotTrackWidth}px` }}
            >
              {photos.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  type="button"
                  aria-label={`${index + 1}번째 사진`}
                  onClick={() => scrollTo(index)}
                  className="pointer-events-auto size-1.5 shrink-0 rounded-full bg-white/40 transition hover:bg-white/70"
                />
              ))}
              <span
                className="pointer-events-none absolute left-0 top-0 size-1.5 rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06)] will-change-transform"
                style={{
                  transform: `translate3d(${scrollPosition * DOT_STEP_PX}px, 0, 0)`,
                }}
                aria-hidden
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
