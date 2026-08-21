import Link from "next/link";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/constants/legal";

export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">OpenHouse 약관 및 정책</h1>
        <p className="mt-2 text-sm text-zinc-600">시행일: {LEGAL_EFFECTIVE_DATE}</p>
      </div>

      <div className="grid gap-3">
        <Link href="/terms/service" className="rounded-xl border border-zinc-200 bg-white p-5 hover:bg-zinc-50">
          <p className="font-semibold text-zinc-900">이용약관</p>
          <p className="mt-1 text-sm text-zinc-600">OpenHouse 서비스 이용 기준과 회원의 권리·의무를 안내합니다.</p>
        </Link>
        <Link href="/terms/privacy" className="rounded-xl border border-zinc-200 bg-white p-5 hover:bg-zinc-50">
          <p className="font-semibold text-zinc-900">개인정보 처리방침</p>
          <p className="mt-1 text-sm text-zinc-600">수집하는 정보, 이용 목적, 보관 및 삭제 원칙을 안내합니다.</p>
        </Link>
      </div>

      <p className="text-xs leading-5 text-zinc-500">
        현재 문서는 OpenHouse 베타 운영을 위한 초안입니다. 정식 공개 전 운영자 정보, 보관기간 및 외부 처리업체 등 실제 운영 현황에 맞춰 최종 검토합니다.
      </p>
    </div>
  );
}
