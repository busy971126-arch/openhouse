import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventCreatedPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/events/${id}/created`)}`);
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, title, gym_id")
    .eq("id", id)
    .eq("created_by", user.id)
    .maybeSingle();

  if (!event) notFound();

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center">
        <div className="text-4xl">🎉</div>
        <h1 className="mt-3 text-2xl font-bold text-zinc-900">
          이벤트가 만들어졌어요
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          <span className="font-medium text-zinc-900">{event.title}</span>의 기본 일정이
          등록됐어요. 참가자 안내와 안전 정보는 필요할 때 천천히 추가해도 됩니다.
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-zinc-900">프로필 완성하기</p>
        <p className="mt-1 text-xs text-zinc-500">
          아래 정보는 이벤트 상세 설정에서 언제든 추가할 수 있어요.
        </p>
        <div className="mt-4 flex flex-col gap-2 text-sm text-zinc-700">
          <p>□ 신청 마감일</p>
          <p>□ 난이도와 이벤트 설명</p>
          <p>□ 도복 대여·출입 안내</p>
          <p>□ 참가 조건·안전 규칙</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <Link
          href={`/events/${event.id}/edit`}
          className="rounded-lg bg-orange-600 py-3.5 text-center font-semibold text-white hover:bg-orange-700"
        >
          이벤트 상세 설정하기
        </Link>
        <Link
          href={`/events/${event.id}`}
          className="rounded-lg border border-zinc-300 bg-white py-3 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          이벤트 페이지 보기
        </Link>
        <Link
          href={`/host/gyms/${event.gym_id}/events`}
          className="py-2 text-center text-sm font-medium text-zinc-500 hover:text-zinc-700"
        >
          나중에 할게 · 이벤트 관리로 이동
        </Link>
      </div>
    </div>
  );
}
