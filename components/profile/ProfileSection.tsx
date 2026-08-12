type ProfileSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

type ProfileInfoRowProps = {
  label: string;
  value: string;
  emoji?: string;
};

export function ProfileInfoRow({ label, value, emoji }: ProfileInfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="shrink-0 text-zinc-500">
        {emoji ? `${emoji} ` : ""}
        {label}
      </span>
      <span className="text-right font-medium text-zinc-900">{value}</span>
    </div>
  );
}

type ProfileStatRowProps = {
  emoji: string;
  label: string;
  value: string;
};

export function ProfileStatRow({ emoji, label, value }: ProfileStatRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="text-zinc-700">
        {emoji} {label}
      </span>
      <span className="font-semibold text-zinc-900">{value}</span>
    </div>
  );
}
