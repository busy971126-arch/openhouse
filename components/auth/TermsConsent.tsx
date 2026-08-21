"use client";

import Link from "next/link";

type TermsConsentProps = {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  onTermsChange: (value: boolean) => void;
  onPrivacyChange: (value: boolean) => void;
};

export function TermsConsent({
  termsAccepted,
  privacyAccepted,
  onTermsChange,
  onPrivacyChange,
}: TermsConsentProps) {
  const allAccepted = termsAccepted && privacyAccepted;

  function setAll(value: boolean) {
    onTermsChange(value);
    onPrivacyChange(value);
  }

  return (
    <section className="border-y border-zinc-300 py-4">
      <label className="flex cursor-pointer items-start gap-3 border-b border-zinc-200 pb-4">
        <input
          type="checkbox"
          checked={allAccepted}
          onChange={(event) => setAll(event.target.checked)}
          className="mt-0.5 h-5 w-5 rounded border-zinc-300 accent-orange-600"
        />
        <span>
          <span className="block text-sm font-bold text-zinc-950">필수 약관 전체 동의</span>
          <span className="mt-1 block text-xs leading-5 text-zinc-500">
            가입에 필요한 약관만 포함합니다.
          </span>
        </span>
      </label>

      <div className="mt-4 flex flex-col gap-4 text-sm">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => onTermsChange(event.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-zinc-300 accent-orange-600"
          />
          <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <span className="text-zinc-800">이용약관 <span className="text-xs font-bold text-orange-600">필수</span></span>
            <Link
              href="/terms/service"
              target="_blank"
              className="shrink-0 text-xs font-semibold text-zinc-500 underline underline-offset-4 hover:text-zinc-900"
            >
              보기
            </Link>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(event) => onPrivacyChange(event.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-zinc-300 accent-orange-600"
          />
          <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <span className="text-zinc-800">개인정보 처리방침 <span className="text-xs font-bold text-orange-600">필수</span></span>
            <Link
              href="/terms/privacy"
              target="_blank"
              className="shrink-0 text-xs font-semibold text-zinc-500 underline underline-offset-4 hover:text-zinc-900"
            >
              보기
            </Link>
          </span>
        </label>
      </div>
    </section>
  );
}
