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
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <label className="flex cursor-pointer items-start gap-3 border-b border-zinc-100 pb-4">
        <input
          type="checkbox"
          checked={allAccepted}
          onChange={(event) => setAll(event.target.checked)}
          className="mt-0.5 h-5 w-5 rounded border-zinc-300 accent-orange-600"
        />
        <span>
          <span className="block text-sm font-semibold text-zinc-900">전체 동의</span>
          <span className="mt-1 block text-xs leading-5 text-zinc-500">
            OpenHouse 이용에 필요한 필수 약관에 모두 동의합니다.
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
            <span className="text-zinc-800">
              <span className="font-medium text-orange-600">[필수]</span> 이용약관 동의
            </span>
            <Link
              href="/terms/service"
              target="_blank"
              className="shrink-0 text-xs font-medium text-zinc-500 underline hover:text-zinc-800"
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
            <span className="text-zinc-800">
              <span className="font-medium text-orange-600">[필수]</span> 개인정보 처리방침 동의
            </span>
            <Link
              href="/terms/privacy"
              target="_blank"
              className="shrink-0 text-xs font-medium text-zinc-500 underline hover:text-zinc-800"
            >
              보기
            </Link>
          </span>
        </label>
      </div>
    </section>
  );
}
