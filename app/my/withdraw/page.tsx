"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/Alert";
import { SignupField, SignupInput } from "@/components/SignupField";

export default function WithdrawPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("본인 확인을 위해 비밀번호를 입력해주세요.");
      return;
    }

    const confirmed = window.confirm(
      "정말 탈퇴하시겠습니까?\n\n계정·프로필·신청·체육관·일정 데이터가 모두 삭제되며 복구할 수 없습니다.",
    );
    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch("/api/account/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
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

      <form onSubmit={handleWithdraw} className="flex flex-col gap-4">
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

      <p className="text-xs text-zinc-500">
        체육관 운영자인 경우 등록한 체육관과 일정도 함께 삭제됩니다.
      </p>
    </div>
  );
}
