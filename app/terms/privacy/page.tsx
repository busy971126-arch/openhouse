import Link from "next/link";
import { LEGAL_EFFECTIVE_DATE, PRIVACY_VERSION } from "@/lib/constants/legal";

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 text-sm leading-7 text-zinc-700">
      <Link href="/terms" className="text-sm font-medium text-orange-600">← 약관 목록</Link>
      <h1 className="mt-4 text-2xl font-bold text-zinc-900">개인정보 처리방침</h1>
      <p className="mt-2 text-xs text-zinc-500">버전 {PRIVACY_VERSION} · 시행일 {LEGAL_EFFECTIVE_DATE}</p>

      <section className="mt-8 space-y-2">
        <h2 className="font-semibold text-zinc-900">1. 처리하는 개인정보</h2>
        <p>계정 생성 시 로그인 제공자가 전달한 식별자, 이메일(제공에 동의한 경우), OpenHouse 닉네임을 처리할 수 있습니다. 이벤트 신청이나 체육관 운영 기능을 사용할 때는 실명, 연락처, 운동 종목·수련 정보, 체급·연령대 등 해당 기능에 필요한 정보를 추가로 받을 수 있습니다.</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-semibold text-zinc-900">2. 이용 목적</h2>
        <p>회원 식별과 로그인, 프로필 제공, 이벤트 참가 신청 및 참가자 관리, 체육관·이벤트 운영, 관심 목록과 알림, 문의 대응, 서비스 보안과 오류 개선을 위해 개인정보를 이용합니다.</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-semibold text-zinc-900">3. 선택 동의 정보</h2>
        <p>서비스 소식 및 이벤트 안내 수신은 선택 사항입니다. 동의하지 않아도 OpenHouse의 기본 기능을 이용할 수 있으며, 실제 발송 기능이 도입되면 설정에서 수신 여부를 변경할 수 있도록 제공합니다.</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-semibold text-zinc-900">4. 보관 및 삭제</h2>
        <p>개인정보는 서비스 제공에 필요한 기간 동안 보관하고, 회원 탈퇴 또는 처리 목적 달성 시 삭제하는 것을 원칙으로 합니다. 다만 법령상 보관 의무가 있거나 분쟁 대응에 필요한 정보는 해당 기간 동안 제한적으로 보관할 수 있습니다.</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-semibold text-zinc-900">5. 제3자 제공</h2>
        <p>이벤트 참가에 필요한 정보는 해당 이벤트의 주최자에게 제공될 수 있습니다. 제공되는 항목과 목적은 참가 신청 화면에서 필요한 범위로 제한하며, 법령에 따른 경우를 제외하고 다른 목적으로 무단 제공하지 않습니다.</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-semibold text-zinc-900">6. 외부 서비스 및 처리 위탁</h2>
        <p>로그인과 서비스 운영을 위해 카카오 로그인, Supabase 인증·데이터베이스, Vercel 호스팅 등 외부 서비스를 사용할 수 있습니다. 정식 공개 전 실제 이용 중인 처리업체, 처리 목적, 국외 이전 여부와 보관 위치를 운영 현황에 맞춰 구체적으로 고지합니다.</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-semibold text-zinc-900">7. 이용자의 권리</h2>
        <p>회원은 서비스에서 자신의 프로필을 확인·수정하고, 회원 탈퇴를 요청할 수 있습니다. 개인정보 처리와 관련한 문의는 OpenHouse 앱 내 문의하기를 통해 접수할 수 있습니다.</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="font-semibold text-zinc-900">8. 보호 조치</h2>
        <p>OpenHouse는 인증, 접근 권한 제한, 데이터베이스 Row Level Security 등 합리적인 기술적·관리적 보호 조치를 적용하고, 필요한 정보만 처리하도록 서비스 구조를 개선합니다.</p>
      </section>

      <section className="mt-6 rounded-lg bg-zinc-50 p-4 text-xs leading-6 text-zinc-600">
        <p className="font-semibold text-zinc-800">베타 운영 안내</p>
        <p className="mt-1">이 문서는 베타 운영을 위한 초안입니다. 정식 공개 전 개인정보 보호 책임자·연락처, 구체적인 보관기간, 처리위탁 및 국외 이전 정보를 실제 운영 현황에 맞춰 최종 확정해야 합니다.</p>
      </section>
    </article>
  );
}
