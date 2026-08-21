"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type KakaoLoginButtonProps = {
  next?: string;
  label?: string;
};

function getSafeNext(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/events";
  }
  return next;
}

export function KakaoLoginButton({
  next = "/events",
  label = "카카오로 계속하기",
}: KakaoLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleKakaoLogin() {
    setError(null);
    setLoading(true);

    const safeNext = getSafeNext(next);
    const onboardingNext = `/onboarding?next=${encodeURIComponent(safeNext)}`;
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(onboardingNext)}`;
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo,
      },
    });

    if (authError) {
      console.error("kakao oauth error:", authError);
      setError(
        "카카오 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleKakaoLogin}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-4 py-3 font-semibold text-[#191919] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5 fill-current"
        >
          <path d="M12 3C6.477 3 2 6.582 2 11c0 2.826 1.834 5.31 4.602 6.733l-.93 3.426a.52.52 0 0 0 .79.57l4.095-2.74c.47.057.952.086 1.443.086 5.523 0 10-3.582 10-8S17.523 3 12 3Z" />
        </svg>
        {loading ? "카카오 연결 중..." : label}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
