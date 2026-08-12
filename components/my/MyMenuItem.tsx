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
      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 opacity-60">
        <div>
          <p className="font-medium text-zinc-700">{label}</p>
          {description && (
            <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
          )}
        </div>
        <span className="text-xs text-zinc-400">추후</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:bg-zinc-50"
    >
      <div>
        <p className="font-medium text-zinc-900">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
            {badge}
          </span>
        )}
        <span className="text-zinc-400">→</span>
      </div>
    </Link>
  );
}
