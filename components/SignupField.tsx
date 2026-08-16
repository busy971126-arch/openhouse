"use client";

import { useState } from "react";
import { FieldLabel } from "@/components/FieldLabel";

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
      <FieldLabel
        required={required}
        className="text-sm font-semibold text-zinc-900"
      >
        {label}
      </FieldLabel>
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

type PasswordInputProps = Omit<SignupInputProps, "type">;

export function PasswordInput({ className = "", ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full rounded-lg border border-zinc-400 bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-200">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`w-full rounded-lg border-0 bg-transparent py-2.5 pl-3 pr-11 text-base text-zinc-900 caret-zinc-900 placeholder:text-zinc-500 outline-none ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500 hover:text-zinc-700"
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
      >
        {visible ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M1 1l22 22" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
