import Link from "next/link";

type MyMenuItemProps = {
  href: string;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
};

export function MyMenuItem({
  href,
  label,
  description,
  badge,
  disabled,
}: MyMenuItemProps) {
  if (disabled) {
    return (
      <div className="flex items-center justify-between border-b border-zinc-200 py-4 opacity-50">
        <div>
          <p className="font-semibold text-zinc-700">{label}</p>
          {description && (
            <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
          )}
        </div>
        <span className="text-[10px] font-bold tracking-wide text-zinc-400">LATER</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group flex items-center justify-between border-b border-zinc-200 py-4 transition"
    >
      <div className="min-w-0 pr-4">
        <p className="font-semibold text-zinc-950 transition group-hover:text-orange-700">
          {label}
        </p>
        {description && (
          <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {badge && (
          <span className="text-xs font-bold text-orange-600">{badge}</span>
        )}
        <span className="text-sm text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-700">
          →
        </span>
      </div>
    </Link>
  );
}
