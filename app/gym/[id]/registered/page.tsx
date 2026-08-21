import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function GymRegisteredPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/gym/${id}/registered`)}`);
  }

  const { data: gym } = await supabase
    .from("gyms")
    .select("id, name, sport, region")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!gym) notFound();

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
          🎉
        </div>
        <p className="mt-5 text-sm font-semibold text-orange-700">기본 등록 완료</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">
          {gym.name}이 등록됐어요
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          이제 참가자에게 보여줄 체육관 프로필을 천천히 완성할 수 있어요.
          지금 모두 입력하지 않아도 됩니다.
        </p>
      </div>

      <section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-zinc-900">프로필 완성하기</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              아래 정보가 있으면 참가자가 체육관을 이해하기 쉬워져요.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            선택
          </span>
        </div>

        <ul className="mt-5 space-y-3 text-sm text-zinc-700">
          <li className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-zinc-100">📷</span>
            대표사진 추가
          </li>
          <li className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-zinc-100">🕐</span>
            수업 시간표와 운영시간 등록
          </li>
          <li className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-zinc-100">🚿</span>
            샤워실·탈의실·주차 등 시설 정보
          </li>
          <li className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-zinc-100">📞</span>
            공개 연락처와 인스타그램
          </li>
        </ul>
      </section>

      <div className="mt-5 flex flex-col gap-3">
        <Link
          href={`/gym/${gym.id}/edit`}
          className="rounded-xl bg-orange-600 px-5 py-3.5 text-center font-semibold text-white hover:bg-orange-700"
        >
          프로필 완성하기
        </Link>
        <Link
          href={`/host/gyms/${gym.id}`}
          className="rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-center font-medium text-zinc-700 hover:bg-zinc-50"
        >
          나중에 할게
        </Link>
      </div>

      <p className="mt-5 text-center text-xs leading-5 text-zinc-500">
        마이페이지 → 운영 관리에서 언제든 체육관 정보를 수정할 수 있어요.
      </p>
    </div>
  );
}
