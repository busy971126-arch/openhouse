"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Alert } from "@/components/Alert";
import { AuthBrandHero } from "@/components/auth/AuthBrandHero";
import { KakaoLoginButton } from "@/components/auth/KakaoLoginButton";
import { TermsConsent } from "@/components/auth/TermsConsent";
import { NicknameField } from "@/components/NicknameField";
import { PasswordInput, SignupField, SignupInput } from "@/components/SignupField";

export default function SignupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [verifiedNickname, setVerifiedNickname] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  function showError(message: string) {
    setError(message);
    requestAnimationFrame(() =>
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedNickname = nickname.trim();
    if (!verifiedNickname || verifiedNickname !== trimmedNickname) {
      showError("닉네임 중복확인을 완료해주세요.");
      return;
    }

    if (!email.trim()) {
      showError("이메일을 입력해주세요.");
      return;
    }

    if (password.length < 8) {
      showError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      showError("OpenHouse 이용약관과 개인정보 처리방침에 동의해주세요.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          profile: {
            nickname: verifiedNickname,
            preferred_sports: ["유도"],
          },
          consents: {
            termsAccepted,
            privacyAccepted,
            marketingAccepted,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showError(result.error ?? "회원가입에 실패했습니다.");
        setLoading(false);
        return;
      }

      if (result.hasSession && result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
        return;
      }

      setSuccess("회원가입이 완료되었습니다. 이메일함에서 인증을 완료해주세요.");
      setLoading(false);
    } catch (cause) {
      console.error("signup request error:", cause);
      showError(
        "회원가입 요청에 실패했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <AuthBrandHero />

      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-900">회원가입</h2>
        <p className="mt-1 text-sm text-zinc-600">
          먼저 계정만 만들어요. 실명·연락처·체급 같은 참가 정보는 이벤트
          신청이 필요할 때 입력합니다.
        </p>
      </div>

      {error && (
        <div ref={errorRef} className="mb-4">
          <Alert message={error} />
        </div>
      )}

      {success && (
        <div className="mb-4">
          <Alert message={success} variant="success" />
          <p className="mt-3 text-center text-sm text-zinc-600">
            <Link href="/login" className="font-medium text-orange-600 underline">
              로그인 페이지로 이동
            </Link>
          </p>
        </div>
      )}

      <KakaoLoginButton next="/events" />
      <p className="mt-2 text-center text-xs text-zinc-500">
        카카오 인증 후 OpenHouse 닉네임과 필수 약관 동의를 한 번만 진행합니다.
      </p>

      <div className="my-5 flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs text-zinc-400">또는 이메일로 가입</span>
        <div className="h-px flex-1 bg-zinc-200" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-4">
            <NicknameField
              value={nickname}
              onChange={setNickname}
              verifiedNickname={verifiedNickname}
              onVerifiedChange={setVerifiedNickname}
            />

            <SignupField label="이메일" required>
              <SignupInput
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="example@email.com"
              />
            </SignupField>

            <SignupField label="비밀번호" required hint="8자 이상">
              <PasswordInput
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
            </SignupField>
          </div>
        </div>

        <TermsConsent
          termsAccepted={termsAccepted}
          privacyAccepted={privacyAccepted}
          marketingAccepted={marketingAccepted}
          onTermsChange={setTermsAccepted}
          onPrivacyChange={setPrivacyAccepted}
          onMarketingChange={setMarketingAccepted}
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-orange-600 py-3 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "가입 중..." : "가입하고 둘러보기"}
        </button>
      </form>

      <div className="mt-6 rounded-xl bg-zinc-50 px-4 py-3 text-xs leading-5 text-zinc-600">
        <p className="font-medium text-zinc-800">가입 후 필요할 때 입력해요</p>
        <p className="mt-1">
          이벤트 참가 시 실명·연락처·수련 정보 등을 한 번 입력하면 다음
          신청부터 다시 사용할 수 있도록 구성할 예정입니다.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-700">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-orange-600">
          로그인
        </Link>
      </p>
    </div>
  );
}
