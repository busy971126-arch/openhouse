import Link from "next/link";
import { HomeMyScheduleSection } from "@/components/home/HomeMyScheduleSection";
import { HomeNearbyEventsSection } from "@/components/home/HomeNearbyEventsSection";
import { HomeNotificationsSection } from "@/components/home/HomeNotificationsSection";
import { HomeRecruitingEventsSection } from "@/components/home/HomeRecruitingEventsSection";
import { HomeSearchBar } from "@/components/home/HomeSearchBar";
import { HomeRecommendedGymsSection } from "@/components/home/HomeRecommendedGyms";

function HomeIntro({ displayLabel }: { displayLabel?: string }) {
  return (
    <section className="pt-1">
      <p className="text-[11px] font-bold tracking-[0.18em] text-orange-600">
        FIND · JOIN · PLAY
      </p>
      {displayLabel && (
        <p className="mt-4 text-sm font-medium text-zinc-600">{displayLabel}님</p>
      )}
      <h1 className={`${displayLabel ? "mt-1 " : "mt-3 "}text-[28px] font-black leading-[1.15] tracking-[-0.03em] text-zinc-950`}>
        이번 주, 새로운 매트로.
      </h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        유도 오픈매트·세미나·대회를 한곳에서.
      </p>
    </section>
  );
}

function OperatorEntry({ href }: { href: string }) {
  return (
    <section className="border-t border-zinc-200 pt-5">
      <p className="text-[11px] font-bold tracking-[0.16em] text-zinc-400">FOR HOSTS</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-950">체육관을 운영하고 있나요?</h2>
          <p className="mt-1 text-sm text-zinc-600">이벤트를 만들고 참가자를 관리하세요.</p>
        </div>
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          등록하기 →
        </Link>
      </div>
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

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-5">
        <Link
          href="/signup"
          className="bg-zinc-950 px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-orange-600"
        >
          OpenHouse 시작하기
        </Link>
        <p className="text-center text-xs text-zinc-500">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-semibold text-zinc-900 underline underline-offset-4">
            로그인
          </Link>
        </p>
      </div>

      <OperatorEntry href="/signup" />
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

      <OperatorEntry href="/gym/new" />
    </>
  );
}

export { GuestHome, MemberHome };
export type { MemberHomeProps };
