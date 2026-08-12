"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import { SignupField, SignupInput } from "@/components/SignupField";
import { mapSignupError } from "@/lib/utils/auth-errors";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(mapSignupError(authError.message));
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">로그인</h1>

      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <SignupField label="이메일" required>
          <SignupInput
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </SignupField>

        <SignupField label="비밀번호" required>
          <SignupInput
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </SignupField>

        <div className="-mt-1 text-right">
          <Link
            href="/login/recover"
            className="text-xs font-medium text-zinc-600 hover:text-orange-600"
          >
            아이디·비밀번호 찾기
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-orange-600 py-3 font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-700">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-medium text-orange-600">
          회원가입
        </Link>
      </p>
    </div>
  );
}
