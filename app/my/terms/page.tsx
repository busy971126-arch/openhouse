import Link from "next/link";

export default function MyTermsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/my" className="text-sm font-medium text-orange-600">
        ← 마이페이지
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900">약관</h1>

      <div className="space-y-4 text-sm text-zinc-600">
        <section>
          <h2 className="font-semibold text-zinc-900">이용약관</h2>
          <p className="mt-2">OpenHouse 이용약관은 준비 중입니다.</p>
        </section>
        <section>
          <h2 className="font-semibold text-zinc-900">개인정보 처리방침</h2>
          <p className="mt-2">개인정보 처리방침은 준비 중입니다.</p>
        </section>
      </div>
    </div>
  );
}
