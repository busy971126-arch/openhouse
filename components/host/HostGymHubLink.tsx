import Link from "next/link";

type HostGymHubLinkProps = {
  href: string;
  icon: string;
  label: string;
  description?: string;
};

export function HostGymHubLink({
  href,
  icon,
  label,
  description,
}: HostGymHubLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-4 hover:bg-zinc-50"
    >
      <span className="text-xl">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-zinc-900">{label}</span>
        {description && (
          <span className="mt-0.5 block text-sm text-zinc-500">{description}</span>
        )}
      </span>
      <span className="text-zinc-400">→</span>
    </Link>
  );
}
