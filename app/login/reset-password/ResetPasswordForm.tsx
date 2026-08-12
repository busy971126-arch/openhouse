"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import { SignupField, SignupInput } from "@/components/SignupField";
import { mapSignupError } from "@/lib/utils/auth-errors";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(mapSignupError(updateError.message));
      return;
    }

    router.push("/login");
    router.refresh();
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="mb-4 text-2xl font-bold text-zinc-900">
          비밀번호 재설정
        </h1>
        <p className="text-sm text-zinc-600">
          링크가 만료되었거나 유효하지 않습니다.
        </p>
        <Link
          href="/login/recover"
          className="mt-4 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          다시 요청하기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">비밀번호 재설정</h1>
      <p className="mb-6 text-sm text-zinc-600">새 비밀번호를 입력해주세요.</p>

      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <SignupField label="새 비밀번호" required hint="8자 이상">
          <SignupInput
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </SignupField>

        <SignupField label="새 비밀번호 확인" required>
          <SignupInput
            type="password"
            required
            minLength={8}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </SignupField>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-orange-600 py-3 font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </div>
  );
}
