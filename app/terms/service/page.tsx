import Link from "next/link";
import { LEGAL_EFFECTIVE_DATE, TERMS_VERSION } from "@/lib/constants/legal";

export default function ServiceTermsPage() {
  return (
    <article className="mx-auto max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 text-sm leading-7 text-zinc-700">
      <Link href="/terms" className="text-sm font-medium text-orange-600">← 약관 목록</Link>
      <h1 className="mt-4 text-2xl font-bold text-zinc-900">OpenHouse 이용약관</h1>
      <p className="mt-2 text-xs text-zinc-500">버전 {TERMS_VERSION} · 시행일 {LEGAL_EFFECTIVE_DATE}</p>

      <section className="mt-8 space-y-2">
        <h2 className="font-semibold text-zinc-900">제1조 목적</h2>
        <p>이 약관은 OpenHouse가 제공하는 스포츠 이벤트·체육관 탐색, 참가 신청, 운영 관리 및 커뮤니티 관련 기능의 이용 조건과 회원 및 서비스 운영 주체의 권리·의무를 정하는 것을 목적으로 합니다.</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-semibold text-zinc-900">제2조 계정 및 회원 정보</h2>
        <p>회원은 카카오 등 소셜 로그인 또는 이메일 계정으로 OpenHouse 계정을 만들 수 있습니다. 회원은 본인이 이용할 수 있는 계정만 사용해야 하며, 닉네임과 참가 신청 정보는 사실에 맞게 입력해야 합니다.</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-semibold text-zinc-900">제3조 이벤트 및 체육관 정보</h2>
        <p>OpenHouse는 주최자와 체육관이 등록한 일정, 장소, 참가 조건, 준비물, 비용 등의 정보를 보여주는 플랫폼입니다. 실제 운영 내용은 주최자가 정하며, 회원은 참가 전 최신 안내와 현장 규칙을 확인해야 합니다.</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-semibold text-zinc-900">제4조 참가 신청과 안전</h2>
        <p>스포츠 활동에는 부상 위험이 있을 수 있습니다. 회원은 자신의 상태와 숙련도를 고려해 참가 여부를 결정하고, 주최자의 안전 지침과 시설 규칙을 따라야 합니다. 긴급 상황이나 건강상 제한이 있는 경우 필요한 정보를 주최자에게 직접 알려야 합니다.</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-semibold text-zinc-900">제5조 금지행위</h2>
        <p>타인 사칭, 허위 정보 등록, 스팸·광고 도배, 괴롭힘, 불법 콘텐츠 게시, 서비스의 정상 운영을 방해하는 행위, 다른 이용자의 개인정보를 무단 수집·공유하는 행위는 금지됩니다.</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-semibold text-zinc-900">제6조 서비스 변경 및 제한</h2>
        <p>베타 기간에는 기능이 변경·추가·중단될 수 있습니다. 보안, 장애 대응, 법적 요구 또는 운영상 필요한 경우 일부 기능이나 계정 이용을 제한할 수 있으며, 가능한 범위에서 사전에 안내합니다.</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-semibold text-zinc-900">제7조 회원 탈퇴</h2>
        <p>회원은 서비스 내 회원 탈퇴 기능을 이용할 수 있습니다. 탈퇴 시 계정과 연결된 데이터는 관련 법령상 보관 의무가 있는 경우를 제외하고 삭제하거나 복구가 어려운 형태로 처리합니다.</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-semibold text-zinc-900">제8조 약관 변경</h2>
        <p>약관이 중요한 내용으로 변경되는 경우 새 버전을 고지하고, 필요한 경우 회원에게 다시 동의를 받습니다. 새 약관에 동의하지 않는 회원은 서비스 이용을 중단하거나 탈퇴할 수 있습니다.</p>
      </section>

      <section className="mt-6 rounded-lg bg-zinc-50 p-4 text-xs leading-6 text-zinc-600">
        <p className="font-semibold text-zinc-800">베타 운영 안내</p>
        <p className="mt-1">현재 약관은 베타 서비스 운영을 위한 초안입니다. 정식 공개 전 사업자·운영자 정보, 유료 기능, 환불 정책 등 실제 운영 범위에 맞춰 최종 보완합니다.</p>
      </section>
    </article>
  );
}
