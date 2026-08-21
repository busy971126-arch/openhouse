import Link from "next/link";
import { HomeMyScheduleSection } from "@/components/home/HomeMyScheduleSection";
import { HomeNearbyEventsSection } from "@/components/home/HomeNearbyEventsSection";
import { HomeNotificationsSection } from "@/components/home/HomeNotificationsSection";
import { HomeRecruitingEventsSection } from "@/components/home/HomeRecruitingEventsSection";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { HomeRecommendedGymsSection } from "@/components/home/HomeRecommendedGyms";

function HomeIntro({ displayLabel }: { displayLabel?: string }) {
  return (
    <section>
      {displayLabel && (
        <p className="text-sm font-medium text-orange-600">
          {displayLabel}님, 안녕하세요
        </p>
      )}
      <h1 className={`${displayLabel ? "mt-2 " : ""}text-2xl font-bold leading-tight text-zinc-900`}>
        주변 운동 이벤트를 한곳에서
      </h1>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        오픈매트·세미나·대회 정보를 찾고 바로 참가하세요.
      </p>
      <p className="mt-1 text-xs text-zinc-500">지금은 유도부터 시작합니다.</p>
    </section>
  );
}

function GuestHome() {
  return (
    <>
      <HomeIntro />

      <HomeSearchBar />

      <HomeRecruitingEventsSection />

      <HomeNearbyEventsSection />

      <HomeRecommendedGymsSection />

      <div className="flex flex-col gap-3">
        <Link
          href="/signup"
          className="rounded-xl border border-zinc-300 bg-white px-6 py-4 text-center text-base font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          회원가입
        </Link>
        <p className="text-center text-sm text-zinc-600">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-medium text-orange-600">
            로그인
          </Link>
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">운영자이신가요?</h2>
        <p className="mt-2 text-sm text-zinc-600">
          체육관을 등록하고 이벤트를 직접 운영해보세요.
        </p>
        <Link
          href="/signup"
          className="mt-4 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          체육관 등록하기 →
        </Link>
      </section>
    </>
  );
}

type MemberHomeProps = {
  displayLabel: string;
};

function MemberHome({ displayLabel }: MemberHomeProps) {
  return (
    <>
      <HomeIntro displayLabel={displayLabel} />

      <HomeSearchBar />

      <HomeRecruitingEventsSection />

      <HomeMyScheduleSection />

      <HomeNotificationsSection />

      <HomeNearbyEventsSection />

      <HomeRecommendedGymsSection />

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">운영자이신가요?</h2>
        <p className="mt-2 text-sm text-zinc-600">
          체육관을 등록하고 이벤트를 직접 운영해보세요.
        </p>
        <Link
          href="/gym/new"
          className="mt-4 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          체육관 등록하기 →
        </Link>
      </section>
    </>
  );
}

export { GuestHome, MemberHome };
export type { MemberHomeProps };
