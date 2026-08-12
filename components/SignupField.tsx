type SignupFieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
};

export function SignupField({
  label,
  required,
  hint,
  children,
}: SignupFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-zinc-900">
        {label}
        {required && <span className="text-orange-600"> *</span>}
      </span>
      {hint && <span className="text-xs text-zinc-600">{hint}</span>}
      {children}
    </div>
  );
}

type SignupInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function SignupInput({ className = "", ...props }: SignupInputProps) {
  return (
    <input
      {...props}
      className={`rounded-lg border border-zinc-400 bg-white px-3 py-2.5 text-base text-zinc-900 caret-zinc-900 placeholder:text-zinc-500 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 ${className}`}
    />
  );
}
