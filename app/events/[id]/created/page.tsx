import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventPublishButton } from "@/components/events/EventPublishButton";
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
    .select("id, title, gym_id, status")
    .eq("id", id)
    .eq("created_by", user.id)
    .maybeSingle();

  if (!event) notFound();

  const isDraft = event.status === "draft";

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center">
        <div className="text-4xl">🎉</div>
        <h1 className="mt-3 text-2xl font-bold text-zinc-900">
          이벤트가 만들어졌어요
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          <span className="font-medium text-zinc-900">{event.title}</span>의 기본 일정이
          저장됐어요. 아직 참가자에게 공개되지 않았습니다.
        </p>
        {isDraft && (
          <p className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            🟡 작성 중 · 비공개
          </p>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-zinc-900">공개 전 확인하면 좋아요</p>
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
          className="rounded-lg border border-orange-200 bg-white py-3.5 text-center font-semibold text-orange-700 hover:bg-orange-50"
        >
          이벤트 상세 설정하기
        </Link>

        {isDraft ? (
          <EventPublishButton
            eventId={event.id}
            redirectTo={`/events/${event.id}`}
          />
        ) : (
          <Link
            href={`/events/${event.id}`}
            className="rounded-lg bg-orange-600 py-3.5 text-center font-semibold text-white hover:bg-orange-700"
          >
            공개된 이벤트 보기
          </Link>
        )}

        <Link
          href={`/events/${event.id}`}
          className="rounded-lg border border-zinc-300 bg-white py-3 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          미리보기
        </Link>
        <Link
          href={`/host/gyms/${event.gym_id}/events`}
          className="py-2 text-center text-sm font-medium text-zinc-500 hover:text-zinc-700"
        >
          나중에 할게 · 작성 중으로 저장
        </Link>
      </div>
    </div>
  );
}
