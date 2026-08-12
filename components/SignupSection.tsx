type SignupSectionProps = {
  title: string;
  note?: string;
  children: React.ReactNode;
};

export function SignupSection({ title, note, children }: SignupSectionProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-sm font-semibold text-zinc-900">
        {title}
        {note && (
          <span className="ml-2 text-xs font-normal text-zinc-600">{note}</span>
        )}
      </p>
      {children}
    </section>
  );
}
