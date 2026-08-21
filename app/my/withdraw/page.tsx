"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert } from "@/components/Alert";
import { SignupField, SignupInput } from "@/components/SignupField";
import { getPreferredReauthProvider } from "@/lib/auth/providers";
import { createClient } from "@/lib/supabase/client";

type WithdrawAuthMethod = "loading" | "email" | "kakao" | "unsupported";

export default function WithdrawPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reauthVerified = searchParams.get("reauth") === "verified";

  const [authMethod, setAuthMethod] = useState<WithdrawAuthMethod>("loading");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAuthMethod() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        router.replace("/login?redirect=/my/withdraw");
        return;
      }

      const provider = getPreferredReauthProvider(user);
      if (provider === "email" || provider === "kakao") {
        setAuthMethod(provider);
      } else {
        setAuthMethod("unsupported");
      }
    }

    void loadAuthMethod();
    return () => {
      active = false;
    };
  }, [router]);

  async function submitWithdrawal(payload: { password?: string }) {
    const confirmed = window.confirm(
      "정말 탈퇴하시겠습니까?\n\n계정·프로필·신청·체육관·일정 데이터가 모두 삭제되며 복구할 수 없습니다.",
    );
    if (!confirmed) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/account/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "회원 탈퇴에 실패했습니다.");
        setLoading(false);
        return;
      }

      window.alert("회원 탈퇴가 완료되었습니다.");
      router.push("/");
      router.refresh();
    } catch {
      setError("회원 탈퇴 요청에 실패했습니다. 인터넷 연결을 확인해주세요.");
      setLoading(false);
    }
  }

  async function handlePasswordWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("본인 확인을 위해 비밀번호를 입력해주세요.");
      return;
    }

    await submitWithdrawal({ password });
  }

  async function handleKakaoReauth() {
    setError(null);
    setLoading(true);

    try {
      const startResponse = await fetch("/api/account/reauth/start", {
        method: "POST",
      });
      const startResult = await startResponse.json();

      if (!startResponse.ok) {
        setError(startResult.error ?? "본인 확인을 시작하지 못했습니다.");
        setLoading(false);
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/my/withdraw")}&reauth=withdraw`;
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo,
          queryParams: {
            prompt: "login",
          },
        },
      });

      if (authError) {
        console.error("kakao reauth error:", authError);
        setError("카카오 본인 확인을 시작하지 못했습니다. 다시 시도해주세요.");
        setLoading(false);
      }
    } catch {
      setError("카카오 본인 확인 요청에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <Link href="/my" className="text-sm font-medium text-orange-600">
        ← 마이페이지
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">회원 탈퇴</h1>
        <p className="mt-2 text-sm text-zinc-600">
          탈퇴 시 계정과 연결된 프로필, 참가 신청, 체육관·일정 데이터가
          영구 삭제됩니다.
        </p>
      </div>

      {error && <Alert message={error} />}

      {authMethod === "loading" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          로그인 방식을 확인하고 있어요...
        </div>
      )}

      {authMethod === "email" && (
        <form onSubmit={handlePasswordWithdraw} className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600">
            안전한 계정 삭제를 위해 현재 비밀번호로 본인 확인을 진행합니다.
          </p>
          <SignupField label="비밀번호 확인" required>
            <SignupInput
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="현재 비밀번호"
            />
          </SignupField>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg border border-red-300 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {loading ? "탈퇴 처리 중..." : "회원 탈퇴"}
          </button>
        </form>
      )}

      {authMethod === "kakao" && !reauthVerified && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600">
            카카오로 가입한 계정은 OpenHouse 비밀번호가 없습니다. 안전한 계정
            삭제를 위해 카카오 계정으로 한 번 더 본인 확인해주세요.
          </p>
          <button
            type="button"
            onClick={handleKakaoReauth}
            disabled={loading}
            className="rounded-lg bg-[#FEE500] px-4 py-3 font-semibold text-[#191919] hover:brightness-95 disabled:opacity-60"
          >
            {loading ? "카카오 확인 중..." : "카카오로 본인 확인"}
          </button>
        </div>
      )}

      {authMethod === "kakao" && reauthVerified && (
        <div className="flex flex-col gap-4">
          <Alert message="카카오 본인 확인이 완료되었습니다." variant="success" />
          <p className="text-sm text-zinc-600">
            아래 버튼을 누르면 OpenHouse 계정과 연결된 데이터가 영구 삭제됩니다.
          </p>
          <button
            type="button"
            onClick={() => void submitWithdrawal({})}
            disabled={loading}
            className="rounded-lg border border-red-300 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {loading ? "탈퇴 처리 중..." : "회원 탈퇴"}
          </button>
        </div>
      )}

      {authMethod === "unsupported" && (
        <Alert message="현재 로그인 방식의 회원 탈퇴는 아직 지원하지 않습니다. 문의하기를 통해 도움을 요청해주세요." />
      )}

      <p className="text-xs text-zinc-500">
        체육관 운영자인 경우 등록한 체육관과 일정도 함께 삭제됩니다.
      </p>
    </div>
  );
}
