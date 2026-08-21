"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import { AuthBrandHero } from "@/components/auth/AuthBrandHero";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";
import { PasswordInput, SignupField, SignupInput } from "@/components/SignupField";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/constants/legal";
import { mapSignupError } from "@/lib/utils/auth-errors";

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = getSafeNext(searchParams.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      setError(mapSignupError(authError.message));
      return;
    }

    if (authData.user) {
      const { data: consent, error: consentError } = await supabase
        .from("user_consent_records")
        .select("terms_version, privacy_version")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (consentError) {
        console.error("login consent check error:", consentError);
        setLoading(false);
        setError("약관 동의 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const hasCurrentConsent =
        consent?.terms_version === TERMS_VERSION &&
        consent?.privacy_version === PRIVACY_VERSION;

      if (!hasCurrentConsent) {
        router.push(`/onboarding?next=${encodeURIComponent(redirect)}`);
        router.refresh();
        return;
      }
    }

    setLoading(false);
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <AuthBrandHero />

      <h2 className="mb-6 text-xl font-bold text-zinc-900">로그인</h2>

      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      <KakaoLoginButton next={redirect} />

      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs text-zinc-400">또는 이메일로 로그인</span>
        <div className="h-px flex-1 bg-zinc-200" />
      </div>

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
          <PasswordInput
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
            로그인에 문제가 있나요?
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
