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

      <div className="mb-8">
        <p className="text-[10px] font-black tracking-[0.16em] text-orange-600">
          WELCOME IN
        </p>
        <h2 className="mt-2 text-[28px] font-black leading-[1.15] tracking-[-0.035em] text-zinc-950">
          OpenHouse에서
          <br />무엇을 하고 싶으세요?
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-600">
          처음 보여드릴 화면만 맞춥니다. 언제든 참가자와 운영자 역할을 오갈 수 있어요.
        </p>
      </div>

      {error && (
        <div className="mb-5">
          <Alert message={error} />
        </div>
      )}

      {checking ? (
        <div className="border-y border-zinc-300 py-5 text-sm text-zinc-600">
          계정 정보를 확인하고 있어요...
        </div>
      ) : (
        <div className="border-y border-zinc-300">
          <button
            type="button"
            onClick={() => void chooseIntent("participant")}
            disabled={saving !== null}
            className="group flex w-full items-start gap-4 border-b border-zinc-200 py-6 text-left transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="mt-0.5 w-12 shrink-0 text-[10px] font-black tracking-[0.14em] text-orange-600">
              JOIN
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xl font-black tracking-[-0.02em] text-zinc-950 group-hover:text-orange-700">
                운동하러 왔어요
              </span>
              <span className="mt-1.5 block text-sm leading-6 text-zinc-600">
                이벤트와 체육관을 찾고 바로 참가합니다.
              </span>
              <span className="mt-4 block text-xs font-bold tracking-wide text-zinc-500">
                {saving === "participant" ? "저장 중..." : "참가자로 시작"} →
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => void chooseIntent("operator")}
            disabled={saving !== null}
            className="group flex w-full items-start gap-4 py-6 text-left transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="mt-0.5 w-12 shrink-0 text-[10px] font-black tracking-[0.14em] text-zinc-400">
              HOST
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xl font-black tracking-[-0.02em] text-zinc-950 group-hover:text-orange-700">
                체육관·이벤트를 운영해요
              </span>
              <span className="mt-1.5 block text-sm leading-6 text-zinc-600">
                체육관을 등록하고 이벤트를 직접 엽니다.
              </span>
              <span className="mt-4 block text-xs font-bold tracking-wide text-zinc-500">
                {saving === "operator" ? "저장 중..." : "운영 시작"} →
              </span>
            </span>
          </button>
        </div>
      )}

      {!checking && (
        <p className="mt-4 text-xs leading-5 text-zinc-500">
          참가자로 시작해도 마이페이지에서 언제든 체육관을 등록할 수 있습니다.
        </p>
      )}
    </div>
  );
}
