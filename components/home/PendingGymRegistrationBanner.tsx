import Link from "next/link";
import type { PendingGymInfo } from "@/lib/utils/pending-gym-info";

type PendingGymRegistrationBannerProps = {
  pendingGym: PendingGymInfo;
};

export function PendingGymRegistrationBanner({
  pendingGym,
}: PendingGymRegistrationBannerProps) {
  return (
    <div className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-4">
      <p className="font-semibold text-orange-950">체육관 등록을 완료해주세요</p>
      <p className="mt-1 text-sm text-orange-900/90">
        회원가입 시 입력한{" "}
        <span className="font-medium">&quot;{pendingGym.name}&quot;</span> 정보가
        저장되어 있습니다. 이메일 확인 후 체육관 정보를 마무리해주세요.
      </p>
      <Link
        href="/gym/new"
        className="mt-3 inline-flex rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
      >
        체육관 등록하기 →
      </Link>
    </div>
  );
}
