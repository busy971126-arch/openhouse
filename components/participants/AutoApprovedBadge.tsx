type AutoApprovedBadgeProps = {
  className?: string;
};

export function AutoApprovedBadge({ className = "" }: AutoApprovedBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800 ${className}`}
    >
      자동 승인됨
    </span>
  );
}
