import type { ReactNode } from "react";

type GymFormBlockProps = {
  title?: string;
  hint?: string;
  children: ReactNode;
};

export function GymFormBlock({ title, hint, children }: GymFormBlockProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {(title || hint) && (
        <div>
          {title && (
            <p className="text-sm font-medium text-zinc-900">{title}</p>
          )}
          {hint && (
            <p className={`text-xs text-zinc-500 ${title ? "mt-0.5" : ""}`}>
              {hint}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

type GymFormGroupProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function GymFormGroup({
  title,
  description,
  children,
}: GymFormGroupProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <header className="border-b border-zinc-100 bg-zinc-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
        )}
      </header>
      <div className="divide-y divide-zinc-100">{children}</div>
    </section>
  );
}
