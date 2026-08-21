"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/Alert";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";
import { SignupField, SignupInput } from "@/components/SignupField";
import { createClient } from "@/lib/supabase/client";
import { mapSignupError } from "@/lib/utils/auth-errors";

export default function RecoverForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/login/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo },
    );

    setLoading(false);

    if (resetError) {
      setError(mapSignupError(resetError.message));
      return;
    }

    setSuccess(
      "비밀번호 재설정 링크를 이메일로 보냈습니다. 메일함을 확인해주세요.",
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <Link
        href="/login"
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        ← 로그인
      </Link>

      <h1 className="mb-2 mt-4 text-2xl font-bold text-zinc-900">
        로그인에 문제가 있나요?
      </h1>
      <p className="mb-6 text-sm text-zinc-600">
        가입한 방식에 맞는 방법으로 다시 로그인하거나 비밀번호를 재설정할 수
        있어요.
      </p>

      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">
          카카오로 가입하셨나요?
        </h2>
        <p className="mb-4 mt-2 text-sm text-zinc-600">
          OpenHouse 비밀번호 없이 카카오 계정으로 바로 로그인할 수 있습니다.
        </p>
        <KakaoLoginButton next="/events" label="카카오로 로그인" />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">
          이메일로 가입하셨나요?
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          가입한 이메일로 비밀번호 재설정 링크를 보내드립니다.
        </p>

        <form onSubmit={handleResetPassword} className="mt-4 flex flex-col gap-4">
          <SignupField label="이메일" required>
            <SignupInput
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </SignupField>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-orange-600 py-3 font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? "전송 중..." : "재설정 링크 받기"}
          </button>
        </form>
      </section>

      <p className="mt-5 text-center text-xs text-zinc-500">
        가입 방식을 기억하기 어렵다면{" "}
        <Link href="/my/inquiries" className="text-orange-600 underline">
          문의하기
        </Link>
        를 이용해주세요.
      </p>
    </div>
  );
}
