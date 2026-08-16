"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginRequiredPromptButtonProps = {
  loginRedirect?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
};

export function LoginRequiredPromptButton({
  loginRedirect = "/",
  description = "로그인하면 추천 체육관 전체를 볼 수 있어요.",
  className = "",
  children = "전체 보기 →",
}: LoginRequiredPromptButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function goLogin() {
    router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="닫기"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-required-title"
            className="relative w-full max-w-xs rounded-xl bg-white p-5 shadow-xl"
          >
            <p
              id="login-required-title"
              className="text-sm font-semibold text-zinc-900"
            >
              로그인 후 이용 가능합니다
            </p>
            <p className="mt-2 text-sm text-zinc-600">{description}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={goLogin}
                className="flex-1 rounded-lg bg-orange-600 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              >
                로그인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
