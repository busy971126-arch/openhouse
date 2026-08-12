"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import { SignupField, SignupInput } from "@/components/SignupField";
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
        아이디·비밀번호 찾기
      </h1>
      <p className="mb-6 text-sm text-zinc-600">
        OpenHouse는 이메일로 로그인합니다.
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
        <h2 className="text-sm font-semibold text-zinc-900">아이디 찾기</h2>
        <p className="mt-2 text-sm text-zinc-600">
          가입 시 사용한 <span className="font-medium text-zinc-800">이메일</span>
          이 아이디입니다. 기억나지 않으면 가입할 때 쓴 메일 주소를
          확인해주세요.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">비밀번호 찾기</h2>
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
    </div>
  );
}
