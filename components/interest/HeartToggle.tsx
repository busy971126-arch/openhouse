"use client";

type HeartToggleProps = {
  isInterested: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
  size?: "xs" | "sm" | "md";
  variant?: "default" | "overlay";
  ariaLabel?: string;
};

const ICON_SIZE = {
  xs: "size-4",
  sm: "size-5",
  md: "size-6",
} as const;

const TOUCH_CLASS = {
  xs: "size-10",
  sm: "size-10",
  md: "size-11",
} as const;

const HEART_COLOR = {
  default: {
    empty: "text-zinc-400",
    filled: "text-red-500",
  },
  overlay: {
    empty: "text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]",
    filled: "text-red-400 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]",
  },
} as const;

function HeartIcon({
  filled,
  className,
}: {
  filled: boolean;
  className: string;
}) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.312 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"
        />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

export function HeartToggle({
  isInterested,
  onToggle,
  disabled = false,
  className = "",
  size = "md",
  variant = "default",
  ariaLabel = "관심 등록",
}: HeartToggleProps) {
  const colors = HEART_COLOR[variant];

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={isInterested}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      className={`inline-flex shrink-0 items-center justify-center transition disabled:opacity-50 ${TOUCH_CLASS[size]} ${className}`}
    >
      <HeartIcon
        filled={isInterested}
        className={`${ICON_SIZE[size]} ${isInterested ? colors.filled : colors.empty}`}
      />
    </button>
  );
}
