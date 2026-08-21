"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/Alert";
import { AuthBrandHero } from "@/components/auth/AuthBrandHero";
import { createClient } from "@/lib/supabase/client";

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/events";
  }
  return value;
}

type UseIntent = "participant" | "operator";

export default function OnboardingRolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = getSafeNext(searchParams.get("next"));
  const supabase = useMemo(() => createClient(), []);

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState<UseIntent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(`/onboarding/role?next=${encodeURIComponent(next)}`)}`);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("initial_use_intent")
        .eq("id", user.id)
        .single();

      if (!active) return;

      if (profileError) {
        console.error("onboarding role profile load error:", profileError);
        setError("계정 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
        setChecking(false);
        return;
      }

      if (profile?.initial_use_intent) {
        router.replace(next);
        router.refresh();
        return;
      }

      setChecking(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [next, router, supabase]);

  async function chooseIntent(intent: UseIntent) {
    setError(null);
    setSaving(intent);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(null);
      router.replace(`/login?redirect=${encodeURIComponent(`/onboarding/role?next=${encodeURIComponent(next)}`)}`);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        initial_use_intent: intent,
        initial_use_intent_selected_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("onboarding role save error:", updateError);
      setSaving(null);
      setError("선택 내용을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (intent === "operator") {
      router.replace("/gym/new?from=onboarding");
    } else {
      router.replace(next);
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <AuthBrandHero />

      <div className="mb-6">
        <p className="text-sm font-medium text-orange-600">가입 완료</p>
        <h2 className="mt-1 text-2xl font-bold text-zinc-900">
          OpenHouse에서 무엇을 하고 싶으세요?
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          처음 보여드릴 화면을 맞추기 위한 질문이에요. 계정 종류를 영구적으로
          나누는 선택은 아닙니다.
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      {checking ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
          계정 정보를 확인하고 있어요...
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => void chooseIntent("participant")}
            disabled={saving !== null}
            className="rounded-2xl border border-zinc-200 bg-white p-5 text-left transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xl">
                🥋
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900">운동하러 왔어요</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  이벤트와 체육관을 찾아보고 참가하고 싶어요.
                </p>
                <p className="mt-3 text-sm font-semibold text-orange-600">
                  {saving === "participant" ? "저장 중..." : "일반 이용자로 시작"} →
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => void chooseIntent("operator")}
            disabled={saving !== null}
            className="rounded-2xl border border-zinc-200 bg-white p-5 text-left transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl">
                🏠
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900">
                  체육관·이벤트를 운영해요
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  체육관을 등록하고 이벤트를 직접 열고 싶어요.
                </p>
                <p className="mt-3 text-sm font-semibold text-orange-600">
                  {saving === "operator" ? "저장 중..." : "운영자 등록 시작"} →
                </p>
              </div>
            </div>
          </button>

          <p className="px-2 text-center text-xs leading-5 text-zinc-500">
            일반 이용자로 시작해도 마이페이지에서 언제든 운영자 등록을 할 수 있어요.
          </p>
        </div>
      )}
    </div>
  );
}
