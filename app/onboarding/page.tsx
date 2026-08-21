"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/Alert";
import { AuthBrandHero } from "@/components/auth/AuthBrandHero";
import { TermsConsent } from "@/components/auth/TermsConsent";
import { NicknameField } from "@/components/NicknameField";
import { createClient } from "@/lib/supabase/client";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/constants/legal";

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/events";
  }
  return value;
}

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = getSafeNext(searchParams.get("next"));
  const supabase = useMemo(() => createClient(), []);

  const [nickname, setNickname] = useState("");
  const [verifiedNickname, setVerifiedNickname] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [consentCurrent, setConsentCurrent] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(next)}`);
        return;
      }

      const [{ data: profile, error: profileError }, { data: consent, error: consentError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("nickname")
            .eq("id", user.id)
            .single(),
          supabase
            .from("user_consent_records")
            .select("terms_version, privacy_version, marketing_agreed")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      if (!active) return;

      if (profileError) {
        console.error("onboarding profile load error:", profileError);
        setError("프로필을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        setCheckingSession(false);
        return;
      }

      if (consentError) {
        console.error("onboarding consent load error:", consentError);
        setError("약관 동의 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
        setCheckingSession(false);
        return;
      }

      const currentConsent =
        consent?.terms_version === TERMS_VERSION &&
        consent?.privacy_version === PRIVACY_VERSION;

      if (currentConsent) {
        setTermsAccepted(true);
        setPrivacyAccepted(true);
        setMarketingAccepted(Boolean(consent?.marketing_agreed));
        setConsentCurrent(true);
      } else if (consent) {
        setMarketingAccepted(Boolean(consent.marketing_agreed));
      }

      const existingNickname = profile?.nickname?.trim() ?? "";
      if (existingNickname) {
        setNickname(existingNickname);
        setVerifiedNickname(existingNickname);
      }

      if (existingNickname && currentConsent) {
        router.replace(next);
        router.refresh();
        return;
      }

      setCheckingSession(false);
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [next, router, supabase]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmed = nickname.trim();
    if (!verifiedNickname || verifiedNickname !== trimmed) {
      setError("닉네임 중복확인을 완료해주세요.");
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setError("OpenHouse 이용약관과 개인정보 처리방침에 동의해주세요.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.replace(`/login?redirect=${encodeURIComponent(next)}`);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        nickname: verifiedNickname,
        preferred_sports: ["유도"],
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("onboarding profile update error:", updateError);
      setSaving(false);
      setError(
        updateError.message.toLowerCase().includes("unique")
          ? "이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요."
          : "프로필 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
      setVerifiedNickname(null);
      return;
    }

    if (!consentCurrent) {
      const { error: consentInsertError } = await supabase
        .from("user_consent_records")
        .insert({
          user_id: user.id,
          terms_version: TERMS_VERSION,
          privacy_version: PRIVACY_VERSION,
          terms_agreed: true,
          privacy_agreed: true,
          marketing_agreed: marketingAccepted,
          source: "onboarding_social",
        });

      if (consentInsertError) {
        console.error("onboarding consent insert error:", consentInsertError);
        setSaving(false);
        setError("약관 동의를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <AuthBrandHero />

      <div className="mb-6">
        <h2 className="text-xl font-bold text-zinc-900">거의 다 됐어요</h2>
        <p className="mt-1 text-sm text-zinc-600">
          OpenHouse에서 사용할 닉네임과 필수 약관 동의만 완료하면 바로 시작할 수 있어요.
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      {checkingSession ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
          계정 정보를 확인하고 있어요...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <NicknameField
              value={nickname}
              onChange={setNickname}
              verifiedNickname={verifiedNickname}
              onVerifiedChange={setVerifiedNickname}
            />
          </div>

          <TermsConsent
            termsAccepted={termsAccepted}
            privacyAccepted={privacyAccepted}
            marketingAccepted={marketingAccepted}
            onTermsChange={(value) => {
              setTermsAccepted(value);
              setConsentCurrent(false);
            }}
            onPrivacyChange={(value) => {
              setPrivacyAccepted(value);
              setConsentCurrent(false);
            }}
            onMarketingChange={(value) => {
              setMarketingAccepted(value);
              setConsentCurrent(false);
            }}
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-orange-600 py-3 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "저장 중..." : "동의하고 OpenHouse 시작하기"}
          </button>

          <p className="text-center text-xs leading-5 text-zinc-500">
            실명, 연락처, 체급 등 참가 정보는 이벤트 신청이 필요할 때만 입력합니다.
          </p>
        </form>
      )}
    </div>
  );
}
